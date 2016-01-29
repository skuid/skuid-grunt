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
	require('nforce-metadata')(nforce);
	var _ = require('underscore');
	var helpers = require('./lib/helpers').init(grunt);
	var archiver = require('archiver');

	var onPollLog = function(status){
		var log = status.status + (status.stateDetail ? '--' + status.stateDetail : '');
		grunt.log.ok(log);
	}

	grunt.registerMultiTask('skuid-apex-test',
		'Deploy source code and run Apex tests. Optionally, generate JUnit Test Report.',
		function(){
			var self = this, done = this.async();

			var options = this.options({
				mode:'single',
				generateReport: true,
				reporters: ['junit'],
				reportDest: 'testing/reports/',
				deployOptions: {testLevel: 'RunLocalTests'},
				pollEvents: {poll: onPollLog},
				nforceOptions:{
					'mode': 'single',
					'redirectUri': 'http://localhost:3000/oauth/_callback',
					plugins: ['meta'],
					metaOpts:{ pollInterval: 10000 },
				}
			});

			var org = nforce.createConnection(helpers.getOrgOptions(options))
			org.authenticate(helpers.getOrgCredentials(options))
				.then(function(){
					var archive = archiver('zip')
						.directory(options.src, 'testapexarchive')
						.finalize();
					var promise = org.meta.deployAndPoll({
						zipFile: archive,
						deployOptions: options.deployOptions
					});
					_.each(options.pollEvents, function(fn, event){
						promise.poller.on(event, fn);
					});
					return promise;
				})
				.then(function(result){
					if(result.success == true){
						grunt.log.ok('Deployment and Apex Tests ran successfully.');
					}
					else if(result.success == false){
						grunt.fail.fatal(
							'Deployment failed. Please see deployment status in Salesforce.'
							);
					}
					if(!options.generateReport){
						done();
					}
					return org.meta.checkDeployStatus({id: result.id, includeDetails: true});
				})
				.then(function(details){
					_.each(options.reporters,function(reporter){
						helpers.generateReport(reporter, options.reportDest, details);
					});
					grunt.log.write('All Reports Generated');
					done();
				})
				.error(function(error){
					grunt.fail.fatal(JSON.stringify(error));
				});
		});
};