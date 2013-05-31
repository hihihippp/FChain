module.exports = function(grunt) {

  var license = '// fchain v1.0.0 \n// (c) 2013 Sergey Melnikov \n\n// fchain may be freely distributed under the MIT license\n\n\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: license
      },
      dist: {
        files: {
          'FChain.min.js': ['FChain.js']
        }
      }
    },
    jshint: {
      files: ['FChain.js'],
      options: {
          boss: true,
          eqnull: true,
          expr: true,
          bitwise: true,
          camelcase: true,
          eqeqeq: true,
          forin: true,
          immed: true,
          noarg: true,
          newcap: false,
	        node: true
      }
    },
    jasmine: {
      FChain : {
       src: ['FChain.js'],
        options: {
          specs: ['specs/FChain.spec.js']
        }
      }
    },
    watch: {
      src : {
        files: ['<%= jshint.files %>','Gruntfile.js'],
        tasks: ['uglify','jshint', 'jasmine']
      },
      test: {
        files: ['<%= jasmine.FChain.options.specs %>'],
        tasks: ['jasmine']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['uglify','jshint','jasmine']);

};
