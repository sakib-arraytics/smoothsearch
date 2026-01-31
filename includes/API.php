<?php
/**
 * REST API
 *
 * Handles REST API endpoints for the admin interface.
 * Uses SHORTINIT optimization where possible.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * API class
 */
class API {
	/**
	 * Settings manager
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Indexer
	 *
	 * @var Indexer
	 */
	private $indexer;

	/**
	 * Product repository
	 *
	 * @var ProductRepository
	 */
	private $repository;

	/**
	 * Constructor
	 *
	 * @param Settings          $settings Settings manager.
	 * @param Indexer           $indexer Indexer.
	 * @param ProductRepository $repository Product repository.
	 */
	public function __construct( Settings $settings, Indexer $indexer, ProductRepository $repository ) {
		$this->settings   = $settings;
		$this->indexer    = $indexer;
		$this->repository = $repository;
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		// Settings endpoints.
		register_rest_route(
			'smooth-search/v1',
			'/settings',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);

		register_rest_route(
			'smooth-search/v1',
			'/settings',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);

		// Health/status endpoint.
		register_rest_route(
			'smooth-search/v1',
			'/health',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_health' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);

		// Rebuild index endpoint.
		register_rest_route(
			'smooth-search/v1',
			'/rebuild',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'trigger_rebuild' ),
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);

		// Index file endpoint (public, for frontend).
		register_rest_route(
			'smooth-search/v1',
			'/index',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'serve_index' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get settings
	 *
	 * @return \WP_REST_Response
	 */
	public function get_settings() {
		$settings = $this->settings->get_all();

		/**
		 * Filter settings returned by API.
		 *
		 * @param array $settings Settings array.
		 */
		$settings = apply_filters( 'smooth_search_get_settings', $settings );

		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => $settings,
			)
		);
	}

	/**
	 * Update settings
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function update_settings( $request ) {
		$new_settings = $request->get_json_params();

		$updated = $this->settings->update( $new_settings );

		return rest_ensure_response(
			array(
				'success' => $updated,
				'data'    => $this->settings->get_all(),
			)
		);
	}

	/**
	 * Get health status
	 *
	 * @return \WP_REST_Response
	 */
	public function get_health() {
		$status = $this->indexer->get_status();

		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => $status,
			)
		);
	}

	/**
	 * Trigger index rebuild
	 *
	 * @return \WP_REST_Response
	 */
	public function trigger_rebuild() {
		$started = $this->indexer->start_rebuild();

		return rest_ensure_response(
			array(
				'success' => $started,
				'message' => $started ? 'Index rebuild started' : 'Failed to start rebuild',
			)
		);
	}

	/**
	 * Serve binary index file
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function serve_index() {
		$upload_dir = wp_upload_dir();
		$index_file = $upload_dir['basedir'] . '/smooth-search/index.json';

		// Check if index exists.
		if ( ! file_exists( $index_file ) ) {
			// Try to build index if it doesn't exist.
			$this->indexer->start_rebuild();
			
			return new \WP_Error(
				'no_index',
				__( 'Search index not found. Building index now. Please try again in a few moments.', 'smooth-search' ),
				array( 'status' => 404 )
			);
		}

		// Get file stats.
		$file_size     = filesize( $index_file );
		$last_modified = filemtime( $index_file );

		// Check If-Modified-Since header.
		$if_modified_since = isset( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ? strtotime( sanitize_text_field( wp_unslash( $_SERVER['HTTP_IF_MODIFIED_SINCE'] ) ) ) : 0;

		if ( $if_modified_since && $if_modified_since >= $last_modified ) {
			status_header( 304 );
			exit;
		}


		// Read index file.
		$index_data = file_get_contents( $index_file );
		
		if ( false === $index_data ) {
			return new \WP_Error(
				'read_error',
				__( 'Failed to read search index.', 'smooth-search' ),
				array( 'status' => 500 )
			);
		}

		// Decode JSON to verify it's valid.
		$products = json_decode( $index_data, true );
		
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new \WP_Error(
				'invalid_json',
				__( 'Search index is corrupted. Please rebuild.', 'smooth-search' ),
				array( 'status' => 500 )
			);
		}

		// Return products array directly (not wrapped in success/data).
		$response = new \WP_REST_Response( $products );

		// Set cache headers (let WordPress handle Content-Length automatically).
		$response->header( 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400' );
		$response->header( 'Last-Modified', gmdate( 'D, d M Y H:i:s', $last_modified ) . ' GMT' );
		$response->header( 'ETag', md5( $index_data ) );

		return $response;
	}

	/**
	 * Check permissions
	 *
	 * @return bool
	 */
	public function check_permissions() {
		return current_user_can( 'manage_options' );
	}
}
