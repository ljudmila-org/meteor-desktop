meteor-desktop
==============

A HTML5 desktop written in meteor.

![screenshot](http://dug.im/3ddba)

An example of the current (unstable) API for applications:

    <script src = 'lib/Messenger.js'> <!-- or wherever you put it --></script>
    
    <script>
      DesktopApp.create({         // tell the desktop that this window contains an application
        docs: {                   // this application knows how to use documents
          'text/html': {          // we can process text/html
            new: function(cb) {   // provide content for a a new doc of this type
              cb(null,'');       // the new content is an empty string
            },
            open: function(content,cb) {      // open a document
              $('#editor').html(content);
            },
            save: function(cb) {              // save a document
              cb(null, $('#editor').html());
            }
          },
          'text/plain': {         // we can also process text/plain
            catch: 'text/*'       // ... and we'll treat  any text file as text/plain
            new: function(cb) {   
              cb(null,'');         
            },
            open: function(content,cb) {        // open a document
              $('#editor').text(content);
            },
            save: function(cb) {                // save a document
              cb(null, $('#editor').text());
            }
          }
        }
      })
    </script>
