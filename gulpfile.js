// Include gulp
var gulp = require('gulp');
// Include plugins
var browserSync = require('browser-sync');



gulp.task('serve', function() {
    browserSync({
        server: {
            baseDir: "./"
        },
        port: 45000 /*Randomly high port to avoid clashes*/
    });

    gulp.watch("*.html").on('change', browserSync.reload);
    gulp.watch("js/*.js").on('change', browserSync.reload);
});

// Default Task
gulp.task('default', ['browser-sync']);
