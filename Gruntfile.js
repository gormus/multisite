'use strict';

module.exports = function (grunt) {
  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  require('load-grunt-tasks')(grunt, {scope: ['devDependencies', 'dependencies']});

  var app = {
    pkg: grunt.file.readJSON('package.json'),
    config: grunt.file.readJSON('config.json').config || {},
  };

  var path = require('path');

  grunt.initConfig({
    app: app,

    watch: {
      options: {
        dot: true
      },

      configFiles: {
        files: [ 'Gruntfile.js', 'websites.json' ],
        options: {
          reload: true
        }
      },

      core: {
        files: ['<%= app.config.path.drupal_core %>/**/*', '!<%= app.config.path.drupal_core %>/.git/'],
        // tasks: ['default'],
      },

      managed_files: {
        files: ['<%= app.config.path.drupal_managed_files %>/**/*'],
        // tasks: ['default'],
      },

      web_sites: {
        files: ['<%= app.config.path.drupal_web_sites %>/**/*'],
        // tasks: ['default'],
      },
    },

    compress: {
      main: {
        options: {
          archive: "<%= app.config.path.backups %>/<%= hostname %>_<%= env %>_<%= grunt.template.today('yyyy-mm-dd') %>.zip",
          pretty: true
        },
        expand: true,
        dot: true,
        cwd: '<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/',
        src: ['**'],
      }
    },

    copy: {
      // Drupal core.
      core: {
        expand: true,
        dot: true,
        cwd: '<%= app.config.path.drupal_core %>/',
        src: ['**', '!.git'],
        dest: '<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/'
      },
      // Shared libraries, modules and themes.
      sites_all: {
        expand: true,
        dot: true,
        cwd: '<%= app.config.path.drupal_sites_all %>/',
        src: ['**'],
        dest: '<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/sites/all/'
      },
      // Own libraries, modules and themes.
      sites_own: {
        expand: true,
        dot: true,
        cwd: '<%= app.config.path.templates %>/sites/',
        src: ['**'],
        dest: '<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/sites/<%= hostname %>/'
      },
      // settings.php
      settings_php: {
        src: ['<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/sites/default/default.settings.php'],
        dest: '<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/sites/<%= hostname %>/settings.php'
      },
      // sites.php
      sites_php: {
        src: ['<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/sites/example.sites.php'],
        dest: '<%= app.config.path.drupal_web_sites %>/<%= env %>/<%= hostname %>/sites/sites.php',
        options: {
          process: function (content, srcpath) {
            var lf = grunt.util.linefeed,
                domain = srcpath.split('/')[2],
                sites = lf +
                  '/**' + lf +
                  ' * Aliases for ' + domain + ' domain.' + lf +
                  ' */' + lf +
                  "$sites['dev." + domain + "'] = '" + domain + "';" + lf +
                  "$sites['test." + domain + "'] = '" + domain + "';" + lf +
                  "$sites['live." + domain + "'] = '" + domain + "';" + lf;
            return content.concat(sites);
          },
        }
      },
      clone: {
        expand: true,
        dot: true,
        cwd: '<%= app.config.path.drupal_web_sites %>/<%= env_source %>/<%= hostname %>/',
        src: ['**'],
        dest: '<%= app.config.path.drupal_web_sites %>/<%= env_target %>/<%= hostname %>/'
      },
      // sitealias: {
      //   nonull: true,
      //   src: ['aliases.drushrc.php'],
      //   // src: [],
      //   dest: 'aliases.drushrc.php',
      //   options: {
      //     process: function (content, srcpath) {
      //       var lf = grunt.util.linefeed,
      //           domains = app.config.domains || [],
      //           aliases = '<?php' + lf;

      //       grunt.log.writeln(srcpath);

      //       domains.forEach(function (hostname) {
      //         for (var e in app.config.env) {
      //             var env = app.config.env[e],
      //                 lf = "\n",
      //                 path = path.resolve('<%= app.config.path.drupal_web_sites %>/' + env + '/' + hostname);
      //             aliases += lf +
      //                 "// Alias for " + env + "." + hostname + " domain." + lf +
      //                 "$aliases['" + env + "." + hostname + "'] = array(" + lf +
      //                 "  'root' => '" + path + "'," + lf +
      //                 "  'uri' => '" + env + "." + hostname + "'," + lf +
      //                 ");" + lf;
      //         }
      //       });
      //       return content.concat(aliases);
      //     },
      //   }
      // }
    },

    clean: ['<%= app.config.path.drupal_web_sites %>/<%= env_target %>/<%= hostname %>'],
  });

  // var opt_domain = grunt.option('domain');
  var opt_env = grunt.option('env');
  var opt_source = grunt.option('source');
  var opt_target = grunt.option('target');

  grunt.registerTask('create-website', ['copy:core', 'copy:sites_all', 'copy:sites_own', 'copy:settings_php', 'copy:sites_php']);
  grunt.registerTask('update-website', ['copy:core', 'copy:sites_all']);
  grunt.registerTask('stage-website', ['copy:clone']);
  grunt.registerTask('deploy-website', ['copy:clone']);
  grunt.registerTask('update-site-aliases', ['create-site-aliases']);

  grunt.registerTask('new', 'Create a new website in development environment.', function(domain) {
    if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
      grunt.config.set('env', app.config.env.development);
      grunt.config.set('hostname', domain);
      grunt.task.run(['create-website']);
    }
    else {
      grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
    }
  });

  grunt.registerTask('update', 'Update a website in development environment.', function(domain) {
    var site_path, site_root = path.resolve(app.config.path.drupal_web_sites, app.config.env.development);
    if (arguments.length === 1) {
      if (domain === 'all') {
        var domains = app.config.domains;

        domains.forEach(function (hostname) {
          site_path = path.resolve(site_root, hostname);
          if (grunt.file.exists(site_path)) {
            grunt.log.oklns('Updated: ' + app.config.env.development + '.' + hostname);
            grunt.config.set('env', app.config.env.development);
            grunt.config.set('hostname', hostname);
            grunt.task.run(['update-website']);
          }
        });
      }
      else if (app.config.domains.indexOf(domain) > -1) {
        site_path = path.resolve(site_root, domain);
        if (grunt.file.exists(site_path)) {
          grunt.config.set('env', app.config.env.development);
          grunt.config.set('hostname', domain);
          grunt.task.run(['update-website']);
        }
        else {
          grunt.log.errorlns('"' + app.config.env.development + '.' + domain + '" doesn\'t exist yet. Create the new website first using: "grunt new:' + domain + '"');
        }
      }
      else {
        grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
      }
    }
  });

  // grunt.registerTask('update', 'Update a website in development environment.', function(domain) {
  //   if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
  //     grunt.config.set('env', app.config.env.development);
  //     grunt.config.set('hostname', domain);
  //     grunt.task.run(['update-website']);
  //   }
  //   else {
  //     grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
  //   }
  // });

  grunt.registerTask('stage', 'Stage the website on staging environment.', function(domain) {
    if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
      grunt.config.set('env_source', app.config.env.development);
      grunt.config.set('env_target', app.config.env.staging);
      grunt.config.set('hostname', domain);
      grunt.task.run(['stage-website']);
    }
    else {
      grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
    }
  });

  grunt.registerTask('deploy', 'Deploy the website on production environment.', function(domain) {
    if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
      grunt.config.set('env_source', app.config.env.staging);
      grunt.config.set('env_target', app.config.env.production);
      grunt.config.set('hostname', domain);
      grunt.task.run(['deploy-website']);
    }
    else {
      grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
    }
  });

  grunt.registerTask('clone', 'Clone a website from one environment to another.', function(domain) {
    if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
      if (app.config.env[opt_source] === undefined) {
        grunt.log.errorlns('"' + opt_source + '" is not a valid environment source name. Check config.js for available environments.');
      }
      else if (app.config.env[opt_target] === undefined) {
        grunt.log.errorlns('"' + opt_target + '" is not a valid environment target name. Check config.js for available environments.');
      }
      else if (app.config.env[opt_source] === app.config.env[opt_target]) {
        grunt.log.errorlns('Source and target options cannot be same.');
      }
      else {
        // grunt.task.requires('empty');
        grunt.config.set('env_source', app.config.env[opt_source]);
        grunt.config.set('env_target', app.config.env[opt_target]);
        grunt.config.set('hostname', domain);
        grunt.task.run(['empty:' + domain, 'copy:clone']);
      }
    }
    else {
      grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
    }
  });

  grunt.registerTask('backup', 'Compress a website environment into a backup file.', function(domain) {
    if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
      if (app.config.env[opt_env] !== undefined) {
        grunt.config.set('env', app.config.env[opt_env]);
        grunt.config.set('hostname', domain);
        grunt.task.run(['compress']);
      }
      else {
        grunt.log.errorlns('"' + opt_env + '" is not a valid environment name. Check config.js for available environments.');
      }
    }
    else {
      grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
    }
  });

  grunt.registerTask('empty', 'Empty a website on target environment.', function(domain) {
    if ((arguments.length === 1) && (app.config.domains.indexOf(domain) > -1)) {
      if (app.config.env[opt_target] !== undefined) {
        grunt.config.set('env_target', app.config.env[opt_target]);
        grunt.config.set('hostname', domain);
        grunt.task.run(['clean']);
      }
      else {
        grunt.log.errorlns('"' + opt_target + '" is not a valid environment name. Check config.js for available environments.');
      }
    }
    else {
      grunt.log.errorlns('"' + domain + '" is not a valid domain name. Check config.js for available domain names.');
    }
  });

  grunt.registerTask('create-site-aliases', 'Create aliases file for Drush.', function() {
    var lf = grunt.util.linefeed,
        domains = app.config.domains || [],
        aliases = '<?php' + lf,
        root = path.resolve(app.config.path.drupal_web_sites);

    domains.forEach(function (hostname) {
      for (var e in app.config.env) {
          var env = app.config.env[e],
              lf = "\n",
              site_path = path.resolve(root, env, hostname);

          aliases += lf +
              "// Alias for " + env + "." + hostname + " domain." + lf +
              "$aliases['" + env + "." + hostname + "'] = array(" + lf +
              "  'root' => '" + site_path + "'," + lf +
              "  'uri' => '" + env + "." + hostname + "'," + lf +
              ");" + lf;
      }
    });

    grunt.file.write('aliases.drushrc.php', aliases);
  });

  grunt.registerTask('help', function() {
    grunt.log.ok('Help is available in README.md');
  });

  // grunt.log.subhead(app.config.env[opt_env]);

};
