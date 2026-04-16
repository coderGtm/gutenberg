/**
 * WordPress dependencies
 */
import { addFilter, applyFilters, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { pickRelevantMediaFiles } from '../edit';

describe( 'pickRelevantMediaFiles', () => {
	it( 'picks caption from media object', () => {
		const media = {
			id: 1,
			url: 'https://example.com/image.jpg',
			alt: 'An image',
			caption: 'A caption',
			link: 'https://example.com/image',
		};

		expect( pickRelevantMediaFiles( media, 'full' ) ).toMatchObject( {
			caption: 'A caption',
		} );
	} );

	it( 'returns undefined caption when not set on media', () => {
		const media = {
			id: 1,
			url: 'https://example.com/image.jpg',
		};

		expect( pickRelevantMediaFiles( media, 'full' ) ).not.toHaveProperty(
			'caption'
		);
	} );
} );

describe( 'editor.mediaUpload.imageCaption filter', () => {
	afterEach( () => {
		removeFilter(
			'editor.mediaUpload.imageCaption',
			'test/image-caption-filter'
		);
	} );

	it( 'passes caption through unchanged when no filter is registered', () => {
		const media = {
			id: 1,
			url: 'https://example.com/image.jpg',
			caption: 'Original caption',
		};
		const { caption } = pickRelevantMediaFiles( media, 'full' );

		const result = applyFilters(
			'editor.mediaUpload.imageCaption',
			caption,
			media
		);

		expect( result ).toBe( 'Original caption' );
	} );

	it( 'allows a filter to modify the caption', () => {
		addFilter(
			'editor.mediaUpload.imageCaption',
			'test/image-caption-filter',
			( caption ) => `Modified: ${ caption }`
		);

		const media = {
			id: 1,
			url: 'https://example.com/image.jpg',
			caption: 'Original caption',
		};
		const { caption } = pickRelevantMediaFiles( media, 'full' );

		const result = applyFilters(
			'editor.mediaUpload.imageCaption',
			caption,
			media
		);

		expect( result ).toBe( 'Modified: Original caption' );
	} );

	it( 'receives the full media object as the second argument', () => {
		const receivedArgs = [];
		addFilter(
			'editor.mediaUpload.imageCaption',
			'test/image-caption-filter',
			( caption, media ) => {
				receivedArgs.push( { caption, media } );
				return caption;
			}
		);

		const media = {
			id: 42,
			url: 'https://example.com/image.jpg',
			caption: 'Photo by Ansel Adams',
			alt: 'A mountain',
		};
		const { caption } = pickRelevantMediaFiles( media, 'full' );

		applyFilters( 'editor.mediaUpload.imageCaption', caption, media );

		expect( receivedArgs ).toHaveLength( 1 );
		expect( receivedArgs[ 0 ].caption ).toBe( 'Photo by Ansel Adams' );
		expect( receivedArgs[ 0 ].media ).toBe( media );
	} );

	it( 'allows a filter to derive caption from media metadata', () => {
		addFilter(
			'editor.mediaUpload.imageCaption',
			'test/image-caption-filter',
			( _caption, media ) => media.meta?.copyright_holder ?? _caption
		);

		const media = {
			id: 1,
			url: 'https://example.com/image.jpg',
			caption: 'Untitled',
			meta: { copyright_holder: 'Jane Doe' },
		};
		const { caption } = pickRelevantMediaFiles( media, 'full' );

		const result = applyFilters(
			'editor.mediaUpload.imageCaption',
			caption,
			media
		);

		expect( result ).toBe( 'Jane Doe' );
	} );

	it( 'allows a filter to clear the caption', () => {
		addFilter(
			'editor.mediaUpload.imageCaption',
			'test/image-caption-filter',
			() => ''
		);

		const media = {
			id: 1,
			url: 'https://example.com/image.jpg',
			caption: 'Some caption',
		};
		const { caption } = pickRelevantMediaFiles( media, 'full' );

		const result = applyFilters(
			'editor.mediaUpload.imageCaption',
			caption,
			media
		);

		expect( result ).toBe( '' );
	} );
} );
