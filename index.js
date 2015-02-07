var emit = require( 'emit-bindings' ),
    dom = require( 'domla' ),
    div = dom.div,
    button = dom.button,
    img = dom.img,
    attributes = {
        name : 'preview',
        hide: true
    };


function Preview( attrs ){ 
    this.attributes = attrs;
}

Preview.prototype = {
    open: function( meta, skoll, done ){
        var files = meta.event.files.filter( filterUrls ),
            size = files.length,
            count = 0,
            render = this.render.bind( this ),
            _files = [];


        function next( err, URI ) {
            
            var btns, back;

            count ++;

            if ( !err && URI ) { 
                _files.push( URI ); 
            }

            if ( count === size ) {
                render( _files, done );

                back = Object.create( { meta: meta } );
                
                if ( typeof skoll.prevPlugin === 'object' ) {
                    back.plugin = skoll.prevPlugin.attributes.name; // this allows for skoll to back to prior plugin
                }

                emit.on( 'skoll.preview.cancel', skoll.open.bind( skoll, back ) );
                emit.on( 'skoll.preview.use', skoll.upload.bind( skoll, meta.event ) );
            }
        }

        if ( !size ) {
            done( null, '' ); // call event
            skoll.upload( meta.event );
            return;
        }

        // if we have files run through each
        files.forEach( function( file ){
                readFile( file, next ); 
            } );    

    },
    teardown: function(){
        emit.removeAllListeners( 'skoll.preview.cancel' );
        emit.removeAllListeners( 'skoll.preview.use' );
    },
    render: function( files, callback ) {
        
        var images, 
            el;
        
        images = div( { className: 'skoll-preview-images' } );
        el = (
            div( { className: 'skoll-preview-wrapper' },
                images,
                div( { className: 'skoll-preview-buttons' },
                    button( { className: 'skoll-button', 'data-emit': 'skoll.preview.cancel' }, 'Cancel' ),
                    button( { className: 'skoll-button', 'data-emit': 'skoll.preview.use' }, 'Use' )
                )
            )
        );

        if( files.length === 1 ) {
            images.appendChild( img( { className: 'skoll-preview-image-large', src: files[ 0 ] } ) );
        }
        else {
            files.forEach( createElementAndAppend( images ) );
        }

        callback( null, el );
    }
};

module.exports = new Preview( attributes );
module.exports.Plugin = Preview; // export out plugin for extending

function createElementAndAppend( container ) {
    return function( file ) {
        container.appendChild( img( { className: 'skoll-preview-image', style: 'background-image:url(' + file + ');' } ) );
    }
}

function filterUrls( file ) {
    return typeof file.url !== 'string';
}

function readFile( file, callback ) {
    var reader = new FileReader();

    reader.onload = function( ) {
        callback( null, reader.result );
    };

    reader.onerror = function( err ) {
        callback( err );
    };

    reader.readAsDataURL( file );
}
