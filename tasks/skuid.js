/*
 * grunt-skuid
 * https://github.com/ethanrogers/skuid-grunt
 *
 * Copyright (c) 2016 Ethan Rogers
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	var nforce = require('nforce');
	var _ = require('underscore');
	var helpers = require('./lib/helpers').init(grunt);
	var apexEndpoint = '/skuid/api/v1/pages';

	grunt.registerMultiTask('skuid-push',
		'Push Skuid pages from source control into any Salesforce org running Skuid',
		function() {
			var self = this,
				done = this.async();

      //ignore development pages is handled by your globbing pattern
      //that you say the source files are
      //['src/skuidpages/Skuid_*'] will pull only the Skuid module
	 		var options = this.options({
				'mode': 'single',
				'redirectUri': 'http://localhost:3000/oauth/_callback',
        'deleted': [],
			});

			/*
			  We have to do some checking of deleted and changed here but that
			  will wait
			 */
			var files = helpers.readPageFiles(this.filesSrc);      
      //support for CSV string as well as arrays, we prefer arrays
      if(!_.isArray(options.deleted)) options.deleted = options.deleted.split(',');
      if(options.deleted.length > 0){
        var deletedPages = options.deleted.map(helpers.getPageUniqueIdFromFilename);  
      }
      
      grunt.log.ok("Preparing to push the following files to your org:\n"
        + this.filesSrc.join("\n"));

			var org = nforce.createConnection(helpers.getOrgOptions(options));
			org.authenticate(helpers.getOrgCredentials(options))
				.then(function() {
					return org.apexRest({
						uri: apexEndpoint,
						method: 'POST',
						body: JSON.stringify({
							changes: files || [],
              deletions: deletedPages,
						})
					});
				})
				.then(function(response) {
					var response = JSON.parse(response);
					if (!response.success) {
						grunt.fail.fatal(JSON.stringify(response));
					} else {
						grunt.log.ok("Pages successfully pushed to " + response.orgName + ".");
						done();
					}
				})
				.error(function(error) {
					grunt.fail.fatal(error);
				});
		});


	grunt.registerMultiTask('skuid-pull',
		'Pull Skuid pages from any Salesforce org running Skuid.',
		function() {
			var self = this,
				done = this.async();
			//@todo figure out how to use this to prevent bad things
			//from happening
			this.requiresConfig(
				// 'skuid-pull.options.dest'
				// 'skuid-pull.password',
				// 'skuid-pull.clientId',
				// 'skuid-pull.clientSecret',
				// 'skuid-pull.target.options.module'
			);

			var options = this.options({
				'mode': 'single',
				'redirectUri': 'http://localhost:3000/oauth/_callback',
			});

			if (_.isArray(options.module)) options.module = options.module.join(',');

			var org = nforce.createConnection(helpers.getOrgOptions(options));

			org.authenticate(helpers.getOrgCredentials(options))
				.then(function() {
					return org.apexRest({
						uri: apexEndpoint,
						method: 'GET',
						urlParams: {
							module: options.module
						}
					});
				})
				.then(function(response) {
					var response = JSON.parse(response);
					if (!response.error) {
						helpers.writeDefinitionFiles(response, self.files[0].dest);
						grunt.log.ok('Success! Skuid pages for module(s) ' 
              + options.module 
              + ' written to ' 
              + options.dir);
						done();
					} else {
						grunt.fail.fatal(response.error);
					}

				})
				.error(function(error) {
					grunt.fail.fatal(error);
				});

		});

  grunt.registerMultiTask('skuid-page-pack', 
    'Pull all the requested Skuid pages from Salesforce as a Page Pack',
    function(){
      var self = this, done = this.async();
      var options = this.options({
        'mode': 'single',
        'redirectUri': 'http://localhost:3000/oauth/_callback',
      });

      if(_.isArray(options.module)) options.module = options.module.join(',');

      var org = nforce.createConnection(helpers.getOrgOptions);
      org.authenticate(nforce.getOrgCredentials)
        .then(function(){
          return org.apexRest({
            'uri': apexEndpoint,
            'method': 'GET',
            'urlParams':{
              'module': options.module,
              'as': 'pagePack',
            }
          });
        })
        .then(function(results){
          var results = JSON.stringify(results);
          grunt.file.write(self.files[0].dest, 
            JSON.stringify(results[options.module]));
          grunt.log.ok('Page Pack pulled and written to ' + self.files[0].dest);

        })
        .error(function(error){
          grunt.fail.fatal(error);
        });
    });
};