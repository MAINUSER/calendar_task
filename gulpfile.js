var syntax         = 'scss', // Syntax: sass or scss;
		gulpVersion    = '4'; // Gulp version: 3 or 4
		gmWatch        = false; // ON/OFF GraphicsMagick watching "img/_src" folder (true/false). Linux install gm: sudo apt update; sudo apt install graphicsmagick

var gulp          = require('gulp'),
		gutil         = require('gulp-util' ),
		sass          = require('gulp-sass'),
		browserSync   = require('browser-sync'),
		concat        = require('gulp-concat'),
		uglify        = require('gulp-uglify'),
		cleancss      = require('gulp-clean-css'),
		rename        = require('gulp-rename'),
		autoprefixer  = require('gulp-autoprefixer'),
		notify        = require('gulp-notify'),
		rsync         = require('gulp-rsync'),
		imageResize   = require('gulp-image-resize'),
		imagemin      = require('gulp-imagemin'),
		del           = require('del');

// Local Server
gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'docs'
		},
		notify: false,
		// open: false,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
	})
});

// Sass|Scss Styles
gulp.task('styles', function() {
	return gulp.src('docs/'+syntax+'/**/*.'+syntax+'')
	.pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
	.pipe(rename({ suffix: '.min', prefix : '' }))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
	.pipe(gulp.dest('docs/css'))
	.pipe(browserSync.stream())
});

// JS
gulp.task('scripts', function() {
	return gulp.src([
		'node_modules/vue/dist/vue.min.js',
		'docs/js/common.js', // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Mifify js (opt.)
	.pipe(gulp.dest('docs/js'))
	.pipe(browserSync.reload({ stream: true }))
});

// Images @x1 & @x2 + Compression | Required graphicsmagick (sudo apt update; sudo apt install graphicsmagick)
gulp.task('img1x', function() {
	return gulp.src('docs/img/_src/**/*.*')
	.pipe(imageResize({ width: '50%' }))
	.pipe(imagemin())
	.pipe(gulp.dest('docs/img/@1x/'))
});
gulp.task('img2x', function() {
	return gulp.src('docs/img/_src/**/*.*')
	.pipe(imageResize({ width: '100%' }))
	.pipe(imagemin())
	.pipe(gulp.dest('docs/img/@2x/'))
});

// Clean @*x IMG's
gulp.task('cleanimg', function() {
	return del(['docs/img/@*'], { force:true })
});

// HTML Live Reload
gulp.task('code', function() {
	return gulp.src('docs/*.html')
	.pipe(browserSync.reload({ stream: true }))
});

// Deploy
gulp.task('rsync', function() {
	return gulp.src('docs/**')
	.pipe(rsync({
		root: 'docs/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Includes files to deploy
		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
});

// If Gulp Version 3
if (gulpVersion == 3) {

	// Img Processing Task for Gulp 3
	gulp.task('img', ['img1x', 'img2x']);
	
	var taskArr = ['styles', 'scripts', 'browser-sync'];
	gmWatch && taskArr.unshift('img');

	gulp.task('watch', taskArr, function() {
		gulp.watch('docs/'+syntax+'/**/*.'+syntax+'', ['styles']);
		gulp.watch(['libs/**/*.js', 'docs/js/common.js'], ['scripts']);
		gulp.watch('docs/*.html', ['code']);
		gmWatch && gulp.watch('docs/img/_src/**/*', ['img']);
	});
	gulp.task('default', ['watch']);

};

// If Gulp Version 4
if (gulpVersion == 4) {

	// Img Processing Task for Gulp 4
	gulp.task('img', gulp.parallel('img1x', 'img2x'));

	gulp.task('watch', function() {
		gulp.watch('docs/'+syntax+'/**/*.'+syntax+'', gulp.parallel('styles'));
		gulp.watch(['libs/**/*.js', 'docs/js/common.js'], gulp.parallel('scripts'));
		gulp.watch('docs/*.html', gulp.parallel('code'));
		gmWatch && gulp.watch('docs/img/_src/**/*', gulp.parallel('img')); // GraphicsMagick watching image sources if allowed.
	});
	gmWatch ? gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch')) 
					: gulp.task('default', gulp.parallel('styles', 'scripts', 'browser-sync', 'watch'));

};