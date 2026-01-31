<?php
/**
 * Product Repository
 *
 * Database abstraction layer for custom search index table.
 * Implements Repository pattern to decouple database operations.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * ProductRepository class
 */
class ProductRepository {
	/**
	 * Table name
	 *
	 * @var string
	 */
	private $table_name;

	/**
	 * Shadow table name (for atomic swaps)
	 *
	 * @var string
	 */
	private $shadow_table_name;

	/**
	 * Constructor
	 */
	public function __construct() {
		global $wpdb;
		$this->table_name        = $wpdb->prefix . 'smooth_search_index';
		$this->shadow_table_name = $wpdb->prefix . 'smooth_search_index_new';
	}

	/**
	 * Create index table
	 *
	 * @param bool $shadow Create shadow table instead.
	 * @return bool Success status.
	 */
	public function create_table( $shadow = false ) {
		global $wpdb;

		$table = $shadow ? $this->shadow_table_name : $this->table_name;

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE IF NOT EXISTS `{$table}` (
			id bigint(20) UNSIGNED NOT NULL,
			title text NOT NULL,
			sku varchar(100) DEFAULT '',
			price decimal(10,2) DEFAULT 0.00,
			thumbnail_url varchar(500) DEFAULT '',
			indexed_at datetime DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY sku_index (sku),
			FULLTEXT KEY title_fulltext (title)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );

		return true;
	}

	/**
	 * Insert products in batch
	 *
	 * @param array $products Array of product data.
	 * @param bool  $shadow Insert into shadow table.
	 * @return int Number of rows inserted.
	 */
	public function insert_batch( $products, $shadow = false ) {
		global $wpdb;

		if ( empty( $products ) ) {
			return 0;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$table = esc_sql( $shadow ? $this->shadow_table_name : $this->table_name );

		$values = array();
		foreach ( $products as $product ) {
			$values[] = $wpdb->prepare(
				'(%d, %s, %s, %f, %s, NOW())',
				$product['id'],
				$product['title'],
				$product['sku'],
				$product['price'],
				$product['thumbnail_url']
			);
		}

		$sql = "INSERT INTO `{$table}` (id, title, sku, price, thumbnail_url, indexed_at) VALUES " . implode( ',', $values );

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$result = $wpdb->query( $sql );
		
		// Invalidate cache
		wp_cache_delete( 'smooth_search_count_' . ( $shadow ? 'shadow' : 'main' ), 'smooth-search' );

		return $result;
	}

	/**
	 * Get all indexed products
	 *
	 * @param bool $shadow Get from shadow table.
	 * @return array
	 */
	public function get_all( $shadow = false ) {
		global $wpdb;

		$cache_key = 'smooth_search_all_' . ( $shadow ? 'shadow' : 'main' );
		$cached    = wp_cache_get( $cache_key, 'smooth-search' );
		
		if ( false !== $cached ) {
			return $cached;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$table = esc_sql( $shadow ? $this->shadow_table_name : $this->table_name );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results( "SELECT id, title, sku, price, thumbnail_url FROM `{$table}` ORDER BY id ASC", ARRAY_A );
		
		$results = $results ?: array();
		
		// Only cache if dataset is reasonable (< 2000 products) to prevent OOM
		if ( count( $results ) < 2000 ) {
			wp_cache_set( $cache_key, $results, 'smooth-search', 60 );
		}
		
		return $results;
	}

	/**
	 * Get total count
	 *
	 * @param bool $shadow Count from shadow table.
	 * @return int
	 */
	public function get_count( $shadow = false ) {
		global $wpdb;
		
		$cache_key = 'smooth_search_count_' . ( $shadow ? 'shadow' : 'main' );
		$cached    = wp_cache_get( $cache_key, 'smooth-search' );
		
		if ( false !== $cached ) {
			return (int) $cached;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$table = esc_sql( $shadow ? $this->shadow_table_name : $this->table_name );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count = $wpdb->get_var( "SELECT COUNT(*) FROM `{$table}`" );

		wp_cache_set( $cache_key, (int) $count, 'smooth-search', 60 );

		return (int) $count;
	}

	/**
	 * Atomic table swap (Expand-Contract pattern)
	 *
	 * @return bool Success status.
	 */
	public function atomic_swap() {
		global $wpdb;

		// Rename old table to backup.
		$backup_table = esc_sql( $this->table_name . '_old' );
		$table_name   = esc_sql( $this->table_name );
		$shadow_name  = esc_sql( $this->shadow_table_name );

		// Drop old backup if exists.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS `{$backup_table}`" );

		// Atomic rename: current -> backup, shadow -> current.
		$sql = "RENAME TABLE 
			`{$table_name}` TO `{$backup_table}`,
			`{$shadow_name}` TO `{$table_name}`";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$result = $wpdb->query( $sql );
		
		// Invalidate cache
		wp_cache_delete( 'smooth_search_count_main', 'smooth-search' );
		wp_cache_delete( 'smooth_search_count_shadow', 'smooth-search' );
		wp_cache_delete( 'smooth_search_all_main', 'smooth-search' );
		wp_cache_delete( 'smooth_search_all_shadow', 'smooth-search' );

		return false !== $result;
	}

	/**
	 * Cleanup old backup table
	 *
	 * @return bool
	 */
	public function cleanup_backup() {
		global $wpdb;

		$backup_table = esc_sql( $this->table_name . '_old' );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$result = $wpdb->query( "DROP TABLE IF EXISTS `{$backup_table}`" );

		return false !== $result;
	}

	/**
	 * Clear table
	 *
	 * @param bool $shadow Clear shadow table.
	 * @return bool
	 */
	public function clear( $shadow = false ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$table = esc_sql( $shadow ? $this->shadow_table_name : $this->table_name );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$result = $wpdb->query( "TRUNCATE TABLE `{$table}`" );
		
		// Invalidate cache
		wp_cache_delete( 'smooth_search_count_' . ( $shadow ? 'shadow' : 'main' ), 'smooth-search' );

		return false !== $result;
	}

	/**
	 * Update single product
	 *
	 * @param int   $product_id Product ID.
	 * @param array $data Product data.
	 * @return bool
	 */
	public function update_product( $product_id, $data ) {
		global $wpdb;

		$result = $wpdb->replace(
			$this->table_name,
			array(
				'id'            => $product_id,
				'title'         => $data['title'],
				'sku'           => $data['sku'],
				'price'         => $data['price'],
				'thumbnail_url' => $data['thumbnail_url'],
				'indexed_at'    => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%s', '%f', '%s', '%s' )
		);
		
		// Invalidate cache
		wp_cache_delete( 'smooth_search_count_main', 'smooth-search' );
		wp_cache_delete( 'smooth_search_all_main', 'smooth-search' );

		return false !== $result;
	}

	/**
	 * Delete product from index
	 *
	 * @param int $product_id Product ID.
	 * @return bool
	 */
	public function delete_product( $product_id ) {
		global $wpdb;

		$result = $wpdb->delete(
			$this->table_name,
			array( 'id' => $product_id ),
			array( '%d' )
		);

		// Invalidate cache
		wp_cache_delete( 'smooth_search_count_main', 'smooth-search' );
		wp_cache_delete( 'smooth_search_all_main', 'smooth-search' );

		return false !== $result;
	}

	/**
	 * Get table name
	 *
	 * @return string
	 */
	public function get_table_name() {
		return $this->table_name;
	}

	/**
	 * Get shadow table name
	 *
	 * @return string
	 */
	public function get_shadow_table_name() {
		return $this->shadow_table_name;
	}
}
