/**
 * Smooth Search - Gutenberg Block
 */

const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl } = wp.components;
const { __ } = wp.i18n;

registerBlockType('smooth-search/search-bar', {
    title: __('Smooth Searchbar', 'smooth-search'),
    description: __('High-performance WooCommerce product search', 'smooth-search'),
    icon: 'search',
    category: 'widgets',
    keywords: [__('search', 'smooth-search'), __('woocommerce', 'smooth-search'), __('products', 'smooth-search')],

    attributes: {
        placeholder: {
            type: 'string',
            default: 'Search products...',
        },
    },

    edit: function (props) {
        const { attributes, setAttributes } = props;

        return (
            <>
                <InspectorControls>
                    <PanelBody title={__('Search Settings', 'smooth-search')}>
                        <TextControl
                            label={__('Placeholder Text', 'smooth-search')}
                            value={attributes.placeholder}
                            onChange={(value) => setAttributes({ placeholder: value })}
                            help={__('Text shown in empty search bar', 'smooth-search')}
                        />
                    </PanelBody>
                </InspectorControls>

                <div className="smooth-search-block-editor">
                    <div style={{
                        padding: '20px',
                        background: '#f9fafb',
                        border: '2px dashed #6366f1',
                        borderRadius: '8px',
                        textAlign: 'center',
                    }}>
                        <span style={{
                            fontSize: '24px',
                            marginBottom: '10px',
                            display: 'block',
                        }}>🔍</span>
                        <strong style={{ display: 'block', marginBottom: '5px' }}>
                            Smooth Searchbar
                        </strong>
                        <small style={{ color: '#6b7280' }}>
                            Lightning-fast product search will appear here
                        </small>
                        <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            background: 'white',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#9ca3af',
                        }}>
                            {attributes.placeholder}
                        </div>
                    </div>
                </div>
            </>
        );
    },

    save: function () {
        // Rendered via PHP
        return null;
    },
});
