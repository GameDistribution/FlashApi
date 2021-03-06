function atob(str) {
    if (str) {
        return new Buffer(str, 'base64').toString('binary');
    }
    return null;
}

module.exports = function(grunt) {

    const startTS = Date.now();
    const xml = {};

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /**
         * Copies certain files over from the src folder to the build folder.
         */
        copy: {
            lib: {
                expand: true,
                flatten: false,
                cwd: './src/',
                src: [
                    'crossdomain.xml',
                    'api/index.html',
                    'index.html',
                    'gdapi.swf',
                    'gdapi_legacy.swf'],
                dest: './lib/',
            },
        },

        /**
         * Cleans our build folder.
         */
        clean: {
            lib: {
                src: ['./lib'],
            },
        },

        /**
         * A code block that will be added to our minified code files.
         * Gets the name and appVersion and other info from the above loaded 'package.json' file.
         * @example <%= banner.join("\\n") %>
         */
        banner: [
            '/*',
            '* Project: <%= pkg.name %>',
            '* Description: <%= pkg.description %>',
            '* Development By: <%= pkg.author %>',
            '* Copyright(c): <%= grunt.template.today("yyyy") %>',
            '* Version: <%= pkg.version %> (<%= grunt.template.today("dd-mm-yyyy HH:MM") %>)',
            '*/',
        ],

        /**
         * Prepends the banner above to the minified files.
         */
        usebanner: {
            options: {
                position: 'top',
                banner: '<%= banner.join("\\n") %>',
                linebreak: true,
            },
            files: {
                src: [
                    'lib/fgo.min.js',
                ],
            },
        },

        /**
         * Browserify is used to support the latest version of javascript.
         * We also concat it while we're at it.
         * We only use Browserify for the mobile sites.
         */
        browserify: {
            options: {
                transform: [['babelify', {presets: ['env']}]],
            },
            lib: {
                src: 'src/**/*.js',
                dest: 'lib/fgo.js',
            },
        },

        /**
         * Do some javascript post processing, like minifying and removing comments.
         */
        uglify: {
            options: {
                position: 'top',
                linebreak: true,
                sourceMap: false,
                sourceMapIncludeSources: false,
                compress: {
                    sequences: true,
                    dead_code: true,
                    conditionals: true,
                    booleans: true,
                    unused: true,
                    if_return: true,
                    join_vars: true,
                },
                mangle: true,
                beautify: false,
                warnings: false,
            },
            lib: {
                src: 'lib/fgo.js',
                dest: 'lib/fgo.min.js',
            },
        },

        /**
         * Setup a simple watcher.
         */
        watch: {
            options: {
                spawn: false,
                debounceDelay: 250,
            },
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['uglify'],
            },
            grunt: {
                files: ['Gruntfile.js'],
            },
        },
        xml: xml,
    });

    // General tasks.
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-google-cloud');

    // Register tasks.
    grunt.registerTask('duration',
        'Displays the duration of the grunt task up until this point.',
        function() {
            const date = new Date(Date.now() - startTS);
            let hh = date.getUTCHours();
            let mm = date.getUTCMinutes();
            let ss = date.getSeconds();
            if (hh < 10) {
                hh = '0' + hh;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            if (ss < 10) {
                ss = '0' + ss;
            }
            console.log('Duration: ' + hh + ':' + mm + ':' + ss);
        });
    grunt.registerTask('xml',
        'Build xml files for each legacy Flash game.',
        function() {
            const mapping = grunt.file.readJSON('./xml_legacy.json');
            grunt.log.write(mapping[0]['id']).ok();
            for (let key in mapping) {
                if (mapping.hasOwnProperty(key)) {
                    grunt.log.write(mapping[key].id).ok();
                    grunt.file.write(`lib/${mapping[key].id}.xml`,
                        '<?xml version="1.0" ?><metadata></metadata>');
                }
            }
        });
    grunt.registerTask('sourcemaps',
        'Build with sourcemaps',
        function() {
            grunt.config.set('uglify.options.sourceMap', true);
            grunt.config.set('uglify.options.sourceMapIncludeSources', true);
        });
    grunt.registerTask('default',
        'Start BrowserSync and watch for any changes so we can do live updates while developing.',
        function() {
            const tasksArray = [
                'copy',
                'browserify',
                'sourcemaps',
                'uglify',
                'usebanner',
                'duration',
                'watch',
            ];
            grunt.task.run(tasksArray);
        });
    grunt.registerTask('build', 'Build and optimize the js.', function() {
        const tasksArray = [
            'clean',
            'browserify',
            'uglify',
            'usebanner',
            'copy',
            'xml',
            'duration',
        ];
        grunt.task.run(tasksArray);
    });
    grunt.registerTask('deploy',
        'Upload the build files.',
        function() {
            const project = grunt.option('project'), // vooxe-gamedistribution
                bucket = grunt.option('bucket'), // gd-sdk-html5
                folderIn = grunt.option('in'), //
                folderOut = grunt.option('out'); //

            // The key is saved as a system parameter within Team City.
            // The service account key of our google cloud account for uploading to
            // storage is stringified and then encoded as base64 using btoa()
            console.log(grunt.option('key'));
            let keyObj = grunt.option('key');
            let key = JSON.parse(atob(keyObj));
            console.log(key);

            if (project === undefined) {
                grunt.fail.warn('Cannot upload without a project name');
            }

            if (bucket === undefined) {
                grunt.fail.warn('OW DEAR GOD THEY ARE STEALING MAH BUCKET!');
            }

            if (key === undefined || key === null) {
                grunt.fail.warn('Cannot upload without an auth key');
            } else {
                console.log('Key loaded...');
            }

            grunt.config.merge({
                gcs: {
                    options: {
                        credentials: key,
                        project: project,
                        bucket: bucket,
                        gzip: true,
                        metadata: {
                            'surrogate-key': 'gcs',
                        },
                    },
                    dist: {
                        cwd: './lib/',
                        src: ['**/*'],
                        dest: '',
                    },
                },
            });

            console.log('Project: ' + project);
            console.log('Bucket: ' + bucket);

            if (folderIn === undefined && folderOut === undefined) {
                console.log('Deploying: ./lib/ to gs://' + bucket + '/');
            } else {
                if (folderIn !== undefined) {
                    if (folderOut === undefined) {
                        grunt.fail.warn(
                            'No use in specifying "in" without "out"');
                    }
                    console.log('Deploying: ../' + folderIn + ' to gs://' +
                        bucket + '/' + folderOut);
                    grunt.config.set('gcs.dist', {
                        cwd: '../' + folderIn, src: ['**/*'], dest: folderOut,
                    });
                } else if (folderOut !== undefined) {
                    grunt.fail.warn('No use in specifying "out" without "in"');
                }
            }

            grunt.task.run('gcs');
        });
};