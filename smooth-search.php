<?php
/**
 * Plugin Name: Smooth Search
 * Plugin URI: https://smoothplugins.com/smooth-search
 * Description: Ultra-high-performance WooCommerce search with Rust/Wasm fuzzy matching engine. INP-optimized for sub-10ms perceived latency.
 * Version: 1.0.0
 * Author: Smooth Plugins
 * Author URI: https://smoothplugins.com
 * Requires at least: 6.0
 * Requires PHP: 8.2
 * WC requires at least: 6.0
 * WC tested up to: 8.5
 * License: GPLv2 or later
 * Text Domain: smooth-search
 * Domain Path: /languages
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

// Plugin constants.
define( 'SMOOTH_SEARCH_VERSION', '1.0.0' );
define( 'SMOOTH_SEARCH_FILE', __FILE__ );
define( 'SMOOTH_SEARCH_PATH', plugin_dir_path( __FILE__ ) );
define( 'SMOOTH_SEARCH_URL', plugin_dir_url( __FILE__ ) );

/**
 * Composer Autoloader
 */
require_once SMOOTH_SEARCH_PATH . 'vendor/autoload.php';

/**
 * Initialize the plugin
 */
function init() {
	// Check dependencies.
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', __NAMESPACE__ . '\\woocommerce_missing_notice' );
		return;
	}

	// Initialize container.
	$container = Container::instance();

	// Register admin menu.
	add_action( 'admin_menu', __NAMESPACE__ . '\\register_admin_menu' );
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\\enqueue_admin_assets' );

	// Initialize REST API.
	add_action( 'rest_api_init', array( $container->get( 'api' ), 'register_routes' ) );

	// Initialize frontend.
	$container->get( 'frontend' );

	// Initialize Gutenberg block.
	$container->get( 'block' );
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\\init' );

/**
 * WooCommerce missing notice
 */
function woocommerce_missing_notice() {
	?>
	<div class="notice notice-error">
		<p><?php esc_html_e( 'Smooth Search requires WooCommerce to be installed and activated.', 'smooth-search' ); ?></p>
	</div>
	<?php
}

/**
 * Register admin menu
 */
function register_admin_menu() {
	add_menu_page(
		__( 'Smooth Search', 'smooth-search' ),
		__( 'Smooth Search', 'smooth-search' ),
		'manage_options',
		'smooth-search',
		__NAMESPACE__ . '\\render_admin_page',
		'dashicons-search',
		56
	);
}

/**
 * Render admin page (React mount point)
 */
function render_admin_page() {
	?>
	<div id="smooth-search-admin-root"></div>
	<?php
}

/**
 * Enqueue admin assets
 */
function enqueue_admin_assets( $hook ) {
	if ( 'toplevel_page_smooth-search' !== $hook ) {
		return;
	}

	// Enqueue React admin app.
	$js_file  = SMOOTH_SEARCH_PATH . 'admin/dist/assets/main.js';
	$css_file = SMOOTH_SEARCH_PATH . 'admin/dist/assets/main.css';

	if ( file_exists( $js_file ) ) {
		wp_enqueue_script(
			'smooth-search-admin',
			SMOOTH_SEARCH_URL . 'admin/dist/assets/main.js',
			array( 'wp-element', 'wp-i18n' ),
			SMOOTH_SEARCH_VERSION,
			true
		);
	}

	if ( file_exists( $css_file ) ) {
		wp_enqueue_style(
			'smooth-search-admin',
			SMOOTH_SEARCH_URL . 'admin/dist/assets/main.css',
			array(),
			SMOOTH_SEARCH_VERSION
		);
	}

	// Pass data to React.
	wp_localize_script(
		'smooth-search-admin',
		'smoothSearchAdmin',
		array(
			'apiUrl'    => rest_url( 'smooth-search/v1' ),
			'nonce'     => wp_create_nonce( 'wp_rest' ),
			'adminUrl'  => admin_url(),
			'pluginUrl' => SMOOTH_SEARCH_URL,
		)
	);
}

/**
 * Activation hook
 */
function activate() {
	// Create custom table.
	$container = Container::instance();
	$container->get( 'repository' )->create_table();

	// Schedule initial index build.
	if ( function_exists( 'as_schedule_single_action' ) ) {
		as_schedule_single_action( time() + 60, 'smooth_search_rebuild_index' );
	}
}
register_activation_hook( __FILE__, __NAMESPACE__ . '\\activate' );

/**
 * Deactivation hook
 */
function deactivate() {
	// Clear scheduled actions.
	if ( function_exists( 'as_unschedule_all_actions' ) ) {
		as_unschedule_all_actions( 'smooth_search_rebuild_index' );
		as_unschedule_all_actions( 'smooth_search_process_batch' );
	}
}
register_deactivation_hook( __FILE__, __NAMESPACE__ . '\\deactivate' );
