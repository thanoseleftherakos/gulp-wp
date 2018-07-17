var gulp     = require('gulp'),
  prompt     = require('gulp-prompt'),
  download   = require('gulp-download'),
  decompress = require('gulp-decompress'),
  del        = require('del'),
  notify     = require('gulp-notify'),
  replace    = require('gulp-replace'),
  rename     = require("gulp-rename"),
  request    = require('request');

var globals = {
    theme_name : "",
    theme_name_original: "",
    theme_path : "",
    dbname: "database_name_here",
    dbuser: "username_here",
    dbpass: "password_here"
}


gulp.task("prompt", function () { 
    return gulp.src( './package.json' )
    .pipe(prompt.prompt({
        type: 'input',
        name: 'theme_name',
        message: 'THEME NAME'
    }, function(res){
        //value is in res.task (the name option gives the key)
        globals.theme_name_original = res.theme_name;
        globals.theme_name = globals.theme_name_original.replace(/\s+/g, '_').toLowerCase();
        globals.theme_path = './wp-content/themes/'+ globals.theme_name + '/'
    }))
    .pipe(prompt.prompt({
        type: 'input',
        name: 'dbname',
        message: 'DATABASE NAME'
    }, function(res){
        //value is in res.task (the name option gives the key)
        globals.dbname = res.dbname;
    }))
    .pipe(prompt.prompt({
        type: 'input',
        name: 'dbuser',
        message: 'DATABASE USERNAME'
    }, function(res){
        //value is in res.task (the name option gives the key)
        globals.dbuser = res.dbuser;
    }))
    .pipe(prompt.prompt({
        type: 'password',
        name: 'dbpass',
        message: 'DATABASE USER PASSWORD'
    }, function(res){
        //value is in res.task (the name option gives the key)
        globals.dbpass = res.dbpass;
    }))
    .pipe( notify( { message: 'Downloading wordpress.. please wait', onLast: true } ) );
});


gulp.task('download-wp', function () {
    return download('https://wordpress.org/latest.tar.gz')
        .pipe(gulp.dest("./downloads"))
        .pipe( notify( { message: 'Wordpress Downloaded! 💯', onLast: true } ) );
});

gulp.task('download-theme', function(){
    return download('https://github.com/thanoseleftherakos/wordify/archive/master.zip')
        .pipe(gulp.dest("./downloads"))
        .pipe( notify( { message: 'Theme Downloaded! 💯', onLast: true } ) );
});

gulp.task('unzip-wp', function () {
    return gulp.src('downloads/latest.tar.gz')
        .pipe(decompress({strip: 1}))
        .pipe(gulp.dest('./'))
        .pipe( notify( { message: 'Wordpress unziped! 💯', onLast: true } ) );
});

gulp.task('delete-default-themes', function(){
    return del(['wp-content/themes/**']);
});

gulp.task('delete-wp-unused-files', function(){
    return del(['license.txt', 'readme.html']);
});

gulp.task('unzip-theme', function () {
    return gulp.src('downloads/master.zip')
        .pipe(decompress({strip: 1}))
        .pipe(gulp.dest( globals.theme_path ));
});

gulp.task('delete-temp', function(){
    return del(['downloads/**']);
});

gulp.task('rename-theme-name', function() {
    return gulp.src(globals.theme_path + '**/*')
      .pipe(replace('wordify', globals.theme_name))
      .pipe(replace('Wordify', globals.theme_name_original))
      .pipe(gulp.dest(globals.theme_path))
      .pipe( notify( { message: 'Wordpress and wordify theme are ready for use! 💯', onLast: true } ) );
});

gulp.task('rename-wp-config', function() {
    return gulp.src("./wp-config-sample.php")
    .pipe(rename("./wp-config.php"))
    .pipe(gulp.dest("./"));
});
gulp.task('delete-wp-config-sample', function() {
    return del(['./wp-config-sample.php']);
});

gulp.task('setup-wp-config', function() {
    return gulp.src("./wp-config.php")
    .pipe(replace('database_name_here', globals.dbname))
    .pipe(replace('username_here', globals.dbuser))
    .pipe(replace('password_here', globals.dbpass))
    .pipe(gulp.dest("./"));
});

gulp.task('wp-salt', function() {
    return request("https://api.wordpress.org/secret-key/1.1/salt/", function(error, response, body) {
        if (!error && response.statusCode == 200)  {
            gulp.src('./wp-config.php')
            .pipe(replace("define('AUTH_KEY',         'put your unique phrase here');", body))
            .pipe(replace("define('SECURE_AUTH_KEY',  'put your unique phrase here');", ''))
            .pipe(replace("define('LOGGED_IN_KEY',    'put your unique phrase here');", ''))
            .pipe(replace("define('NONCE_KEY',        'put your unique phrase here');", ''))
            .pipe(replace("define('AUTH_SALT',        'put your unique phrase here');", ''))
            .pipe(replace("define('SECURE_AUTH_SALT', 'put your unique phrase here');", ''))
            .pipe(replace("define('LOGGED_IN_SALT',   'put your unique phrase here');", ''))
            .pipe(replace("define('NONCE_SALT',       'put your unique phrase here');", ''))
            .pipe(gulp.dest('./'));
        }
    });
});

gulp.task('wpinit', gulp.series('prompt', 'download-wp', 'download-theme', 'unzip-wp', 'delete-default-themes', 'delete-wp-unused-files', 'unzip-theme', 'delete-temp', 'rename-theme-name', 'rename-wp-config', 'delete-wp-config-sample', 'setup-wp-config', 'wp-salt'));