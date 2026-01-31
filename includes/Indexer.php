<?php
/**
 * Indexer
 *
 * Handles product indexing with Action Scheduler integration.
 * Implements atomic table swaps for zero-downtime rebuilds.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * Indexer class
 */
class Indexer {
	/**
	 * Product repository
	 *
	 * @var ProductRepository
	 */
	private $repository;

	/**
	 * Settings
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Batch size for processing
	 *
	 * @var int
	 */
	const BATCH_SIZE = 500;

	/**
	 * Constructor
	 *
	 * @param ProductRepository $repository Product repository.
	 * @param Settings          $settings Settings manager.
	 */
	public function __construct( ProductRepository $repository, Settings $settings ) {
		$this->repository = $repository;
		$this->settings   = $settings;

		$this->register_hooks();
	}

	/**
	 * Register WordPress hooks
	 */
	private function register_hooks() {
		// Action Scheduler hooks.
		add_action( 'smooth_search_rebuild_index', array( $this, 'start_rebuild' ) );
		add_action( 'smooth_search_process_batch', array( $this, 'process_batch' ), 10, 2 );
		add_action( 'smooth_search_finalize_rebuild', array( $this, 'finalize_rebuild' ) );

		// WooCommerce product hooks for incremental updates.
		add_action( 'woocommerce_update_product', array( $this, 'update_product' ), 10, 1 );
		add_action( 'woocommerce_delete_product', array( $this, 'delete_product' ), 10, 1 );
	}

	/**
	 * Start full index rebuild
	 *
	 * @return bool Success status.
	 */
	public function start_rebuild() {
		// Hook before rebuild starts.
		do_action( 'smooth_search_before_rebuild' );

		// Create shadow table.
		$this->repository->create_table( true );

		// Clear shadow table.
		$this->repository->clear( true );

		// Get total product count.
		$total = $this->get_total_products();

		if ( 0 === $total ) {
			return false;
		}

		// Schedule batches.
		$batches = ceil( $total / self::BATCH_SIZE );

		for ( $i = 0; $i < $batches; $i++ ) {
			$offset = $i * self::BATCH_SIZE;

			if ( function_exists( 'as_schedule_single_action' ) ) {
				as_schedule_single_action(
					time() + ( $i * 10 ), // Stagger by 10 seconds.
					'smooth_search_process_batch',
					array( $offset, self::BATCH_SIZE ),
					'smooth-search'
				);
			}
		}

		// Schedule final swap after all batches.
		if ( function_exists( 'as_schedule_single_action' ) ) {
			as_schedule_single_action(
				time() + ( $batches * 10 ) + 30,
				'smooth_search_finalize_rebuild',
				array(),
				'smooth-search'
			);
		}

		return true;
	}

	/**
	 * Process a batch of products
	 *
	 * @param int $offset Offset.
	 * @param int $limit Limit.
	 * @return int Number of products processed.
	 */
	public function process_batch( $offset, $limit ) {
		$products = $this->fetch_products( $offset, $limit );

		if ( empty( $products ) ) {
			return 0;
		}

		$indexed_products = array();

		foreach ( $products as $product_id ) {
			$wc_product = wc_get_product( $product_id );

			if ( ! $wc_product ) {
				continue;
			}

			$data = array(
				'id'            => (int) $wc_product->get_id(),
				'title'         => $wc_product->get_name(),
				'sku'           => $wc_product->get_sku() ?: '',
				'price'         => (float) $wc_product->get_price(),
				'thumbnail_url' => get_the_post_thumbnail_url( (int) $wc_product->get_id(), 'thumbnail' ) ?: '',
			);

			/**
			 * Filter indexed product data.
			 *
			 * @param array       $data       Data to be indexed.
			 * @param \WC_Product $wc_product WooCommerce product object.
			 */
			$data = apply_filters( 'smooth_search_index_product_data', $data, $wc_product );

			if ( ! empty( $data ) ) {
				$indexed_products[] = $data;
			}
		}

		return $this->repository->insert_batch( $indexed_products, true );
	}

	/**
	 * Finalize rebuild (atomic swap)
	 */
	public function finalize_rebuild() {
		// Perform atomic table swap.
		$swapped = $this->repository->atomic_swap();

		if ( $swapped ) {
			// Export binary index.
			$this->export_binary();

			// Cleanup old backup table.
			$this->repository->cleanup_backup();

			// Update last rebuild timestamp.
			update_option( 'smooth_search_last_rebuild', current_time( 'timestamp' ) );

			// Hook after rebuild completes.
			do_action( 'smooth_search_after_rebuild' );
		}
	}

		/**
	 * Export binary index file
	 */
	/**
	 * Export binary index file (Structure of Arrays format)
	 */
	public function export_binary() {
		// FORCE RE-FETCH: Always get fresh data from DB to ensure file sync.
		$products = $this->repository->get_all();

		// Safety Check: If we got empty results, verify if DB is actually empty.
		if ( empty( $products ) ) {
			$count = $this->repository->get_count();
			if ( $count > 0 ) {
				return false;
			}
		}

		// Initialize columnar storage (Structure of Arrays)
		$soa = array(
			'ids'    => array(),
			'titles' => array(),
			'skus'   => array(),
			'prices' => array(),
			'images' => array(),
		);

		foreach ( $products as $p ) {
			$soa['ids'][]    = (int) $p['id'];
			$soa['titles'][] = (string) $p['title'];
			$soa['skus'][]   = (string) $p['sku'];
			$soa['prices'][] = (float) $p['price'];
			$soa['images'][] = (string) $p['thumbnail_url'];
		}

		/**
		 * Filter final index data before export.
		 * 
		 * @param array $soa Structure of Arrays data.
		 */
		$soa = apply_filters( 'smooth_search_index_export_data', $soa );

		// Convert to JSON
		$json = wp_json_encode( $soa, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

		if ( false === $json ) {
			return false;
		}

		// Create upload directory.
		$upload_dir = wp_upload_dir();
		$target_dir = $upload_dir['basedir'] . '/smooth-search';

		if ( ! file_exists( $target_dir ) ) {
			if ( ! wp_mkdir_p( $target_dir ) ) {
				return false;
			}
		}

		// Write file.
		$file_path = $target_dir . '/index.json';
		$result    = file_put_contents( $file_path, $json ); 
		
		if ( false === $result ) {
			return false;
		}

		// Update file metadata.
		update_option(
			'smooth_search_index_meta',
			array(
				'file_size'     => filesize( $file_path ),
				'product_count' => count( $soa['ids'] ),
				'last_modified' => current_time( 'timestamp' ),
			)
		);

		return true;
	}

	/**
	 * Update single product in index
	 *
	 * @param int $product_id Product ID.
	 */
	public function update_product( $product_id ) {
		$wc_product = wc_get_product( $product_id );

		if ( ! $wc_product ) {
			return;
		}

		$data = array(
			'title'         => $wc_product->get_name(),
			'sku'           => $wc_product->get_sku() ?: '',
			'price'         => (float) $wc_product->get_price(),
			'thumbnail_url' => get_the_post_thumbnail_url( $wc_product->get_id(), 'thumbnail' ) ?: '',
		);

		/**
		 * Filter indexed product data.
		 *
		 * @param array       $data       Data to be indexed.
		 * @param \WC_Product $wc_product WooCommerce product object.
		 */
		$data = apply_filters( 'smooth_search_index_product_data', $data, $wc_product );
		
		if ( empty( $data ) ) {
			return;
		}

		$this->repository->update_product( $product_id, $data );

		// Re-export binary.
		$this->export_binary();
	}

	/**
	 * Delete product from index
	 *
	 * @param int $product_id Product ID.
	 */
	public function delete_product( $product_id ) {
		$this->repository->delete_product( $product_id );

		// Re-export binary.
		$this->export_binary();
	}

	/**
	 * Get total product count
	 *
	 * @return int
	 */
	private function get_total_products() {
		$args = array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		);

		$query = new \WP_Query( $args );

		return $query->found_posts;
	}

	/**
	 * Fetch products for indexing
	 *
	 * @param int $offset Offset.
	 * @param int $limit Limit.
	 * @return array
	 */
	private function fetch_products( $offset, $limit ) {
		$args = array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => $limit,
			'offset'         => $offset,
			'orderby'        => 'ID',
			'order'          => 'ASC',
			'fields'         => 'ids', // Only fetch IDs to save memory.
			'no_found_rows'  => true,
		);
		
		/**
		 * Filter indexing query arguments.
		 *
		 * @param array $args WP_Query arguments.
		 */
		$args = apply_filters( 'smooth_search_index_query_args', $args );
		
		$query = new \WP_Query( $args );
		
		return $query->posts;
	}

	/**
	 * Get rebuild status
	 *
	 * @return array Status information.
	 */
	public function get_status() {
		$last_rebuild = get_option( 'smooth_search_last_rebuild', 0 );
		$index_meta   = get_option( 'smooth_search_index_meta', array() );

		// Check for pending batches.
		$pending_batches = 0;
		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$pending_batches = count(
				as_get_scheduled_actions(
					array(
						'hook'   => 'smooth_search_process_batch',
						'status' => 'pending',
						'group'  => 'smooth-search',
					)
				)
			);
		}

		return array(
			'last_rebuild'    => $last_rebuild,
			'product_count'   => $index_meta['product_count'] ?? 0,
			'file_size'       => $index_meta['file_size'] ?? 0,
			'last_modified'   => $index_meta['last_modified'] ?? 0,
			'pending_batches' => $pending_batches,
			'status'          => $pending_batches > 0 ? 'rebuilding' : 'healthy',
			'total_products'  => $this->get_total_products(),
		);
	}
}
