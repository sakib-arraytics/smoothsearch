<?php
/**
 * Frontend Integration
 *
 * Enqueues frontend assets and renders search bar.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * Frontend class
 */
class Frontend {
	/**
	 * Settings
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Constructor
	 *
	 * @param Settings $settings Settings manager.
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_shortcode( 'smooth_search', array( $this, 'render_search_bar' ) );
	}

	/**
	 * Enqueue frontend assets
	 */
	public function enqueue_assets() {
		if ( ! $this->settings->get( 'enabled' ) ) {
			return;
		}

		// Enqueue CSS.
		wp_enqueue_style(
			'smooth-search',
			SMOOTH_SEARCH_URL . 'assets/css/search-bar.css',
			array(),
			SMOOTH_SEARCH_VERSION
		);

		// Enqueue main search bar script (ES6 module).
		wp_enqueue_script(
			'smooth-search',
			SMOOTH_SEARCH_URL . 'assets/js/search-bar.js',
			array( 'wp-hooks' ),
			SMOOTH_SEARCH_VERSION,
			true
		);

		// Generate dynamic CSS variables from settings.
		$css_vars = sprintf(
			':root {
				--smooth-result-bg: %s;
				--smooth-result-hover-bg: %s;
				--smooth-result-text: %s;
				--smooth-result-price: %s;
				--smooth-border-radius: %spx;
				--smooth-font-size: %spx;
				--smooth-font-family: %s;
			}',
			$this->settings->get( 'result_bg', '#ffffff' ),
			$this->settings->get( 'result_hover_bg', '#f9fafb' ),
			$this->settings->get( 'result_text', '#111827' ),
			$this->settings->get( 'result_price', '#6366f1' ),
			$this->settings->get( 'border_radius', 8 ),
			$this->settings->get( 'font_size', 14 ),
			$this->settings->get( 'font_family', 'system-ui' )
		);

		wp_add_inline_style( 'smooth-search', $css_vars );

		// Add module type.
		add_filter(
			'script_loader_tag',
			function ( $tag, $handle ) {
				if ( 'smooth-search' === $handle ) {
					$tag = str_replace( '<script ', '<script type="module" ', $tag );
				}
				return $tag;
			},
			10,
			2
		);

		// Pass config to JavaScript.
		wp_localize_script(
			'smooth-search',
			'smoothSearchConfig',
			array(
				'apiUrl'       => rest_url( 'smooth-search/v1' ),
				'wasmUrl'      => SMOOTH_SEARCH_URL . 'assets/wasm/smooth_search_wasm.js',
				'workerUrl'    => SMOOTH_SEARCH_URL . 'assets/js/search-worker.js',
				'minChars'     => $this->settings->get( 'min_chars' ),
				'debounceMs'   => $this->settings->get( 'debounce_ms' ),
				'resultsLimit' => $this->settings->get( 'results_limit' ),
			)
		);
	}

	/**
	 * Render search bar shortcode
	 *
	 * @return string
	 */
	public function render_search_bar() {
		if ( ! $this->settings->get( 'enabled' ) ) {
			return '';
		}

		ob_start();
		?>
		<div id="smooth-search-container"></div>
		<script type="module">
			import { createSearchBar } from '<?php echo esc_url( SMOOTH_SEARCH_URL . 'assets/js/search-bar.js' ); ?>';
			
			const container = document.getElementById('smooth-search-container');
			const config = window.smoothSearchConfig || {};
			
			if (container) {
				createSearchBar(container, config);
			}
		</script>
		<?php
		return ob_get_clean();
	}
}
