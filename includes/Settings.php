<?php
/**
 * Settings Manager
 *
 * Handles plugin settings with validation and defaults.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * Settings class
 */
class Settings {
	/**
	 * Option name in database
	 *
	 * @var string
	 */
	const OPTION_NAME = 'smooth_search_settings';

	/**
	 * Default settings
	 *
	 * @var array
	 */
	private $defaults = array(
		'enabled'         => true,
		'results_limit'   => 10,
		'min_chars'       => 2,
		'debounce_ms'     => 150,
		'search_fields'   => array(
			'title'       => true,
			'sku'         => true,
			'description' => false,
		),
		'cache_enabled'   => true,
		'cache_ttl'       => 86400,
		'result_bg'       => '#ffffff',
		'result_hover_bg' => '#f9fafb',
		'result_text'     => '#111827',
		'result_price'    => '#6366f1',
		'border_radius'   => 8,
		'font_size'       => 14,
		'font_family'     => 'system-ui',
	);

	/**
	 * Cached settings
	 *
	 * @var array|null
	 */
	private $settings = null;

	/**
	 * Get all settings
	 *
	 * @return array
	 */
	public function get_all() {
		if ( null === $this->settings ) {
			$saved          = get_option( self::OPTION_NAME, array() );
			$this->settings = wp_parse_args( $saved, $this->defaults );
		}
		return $this->settings;
	}

	/**
	 * Get a single setting
	 *
	 * @param string $key Setting key.
	 * @param mixed  $default Default value if not found.
	 * @return mixed
	 */
	public function get( $key, $default = null ) {
		$settings = $this->get_all();
		return $settings[ $key ] ?? $default;
	}

	/**
	 * Update settings
	 *
	 * @param array $new_settings New settings to merge.
	 * @return bool Success status.
	 */
	public function update( $new_settings ) {
		$current = $this->get_all();
		$updated = array_merge( $current, $this->sanitize( $new_settings ) );

		if ( $current === $updated ) {
			return true;
		}

		$result = update_option( self::OPTION_NAME, $updated );

		if ( $result ) {
			$this->settings = $updated;
		}

		return $result;
	}

	/**
	 * Reset to defaults
	 *
	 * @return bool
	 */
	public function reset() {
		$result = update_option( self::OPTION_NAME, $this->defaults );

		if ( $result ) {
			$this->settings = $this->defaults;
		}

		return $result;
	}

	/**
	 * Sanitize settings
	 *
	 * @param array $settings Raw settings.
	 * @return array Sanitized settings.
	 */
	private function sanitize( $settings ) {
		$sanitized = array();

		// Boolean fields.
		foreach ( array( 'enabled', 'cache_enabled' ) as $field ) {
			if ( isset( $settings[ $field ] ) ) {
				$sanitized[ $field ] = (bool) $settings[ $field ];
			}
		}

		// Integer fields.
		foreach ( array( 'results_limit', 'min_chars', 'debounce_ms', 'cache_ttl', 'border_radius', 'font_size' ) as $field ) {
			if ( isset( $settings[ $field ] ) ) {
				$sanitized[ $field ] = absint( $settings[ $field ] );
			}
		}

		// Color fields.
		foreach ( array( 'result_bg', 'result_hover_bg', 'result_text', 'result_price' ) as $field ) {
			if ( isset( $settings[ $field ] ) ) {
				$sanitized[ $field ] = sanitize_hex_color( $settings[ $field ] );
			}
		}

		// Text fields.
		if ( isset( $settings['font_family'] ) ) {
			$sanitized['font_family'] = sanitize_text_field( $settings['font_family'] );
		}

		// Search fields (nested array).
		if ( isset( $settings['search_fields'] ) && is_array( $settings['search_fields'] ) ) {
			$sanitized['search_fields'] = array();
			foreach ( $settings['search_fields'] as $key => $value ) {
				$sanitized['search_fields'][ sanitize_key( $key ) ] = (bool) $value;
			}
		}

		return $sanitized;
	}

	/**
	 * Get defaults
	 *
	 * @return array
	 */
	public function get_defaults() {
		return $this->defaults;
	}
}
