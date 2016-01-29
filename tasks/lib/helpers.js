var _ = require('underscore');
var pd = require('pretty-data').pd;

exports.init = function(grunt){
	var exports = {};
	/**
	 * Prepare the xml and json meta files for the specified Skuid page
	 * @param  {[type]} pagedef [description]
	 * @param  {[type]} pagedir [description]
	 * @return {[type]}         [description]
	 */
	var writePageFile = function(pagedef, pagedir){
		var filenameBase = pagedir + pagedef.uniqueId;
		var xmlDef = {ext: '.xml', contents: pd.xml(pagedef.body)};
		var metaDef = {
			ext: '.json',
			contents: JSON.stringify(_.omit(pagedef, 'body'), null, 3)
		};
		_.each([xmlDef, metaDef], function(item){
			var filename = filenameBase + item.ext;
			grunt.file.write(filenameBase + item.ext, item.contents);
			if(grunt.option('verbose')){
				grunt.log.ok(filename + ' written to ' + pagedir);
			}
		});
	};


	var readPageFile = function(filepath){
		return _.extend(
			grunt.file.readJSON(filepath, {'encoding': 'UTF-8'}),
			{body: grunt.file.read(filepath.replace('.json', '.xml'), {'encoding': 'UTF-8'})}
		);
	}

	var filterOutUnneededFiles = function(filelist){
		return filelist.filter(function(file){
			return file.indexOf('.json') != -1;
		});
	}
	/**
	 * Helper method for setting up the org credentials
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	exports.getOrgCredentials = function(options){
		return {
			username: options.username,
			password: options.password
		};
	}
	/**
	 * Helper method for setting up the org options.
	 * Handles any extra nforce options passed in as config
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	exports.getOrgOptions = function(options){
		var org = {
	      'clientId' : options.clientId,
	      'clientSecret' : options.clientSecret,
	      'mode' : options.mode,
	      'redirectUri': options.redirectUri
	    };

	    //if we pass in any extra nforce options, we should overwrite the defaults
	    if(options.hasOwnProperty('nforceOptions')){
	      org = _.extend(org, options.nforceOptions);
	    }
	    return org;
	}

	/**
	 * Write definition files for a response from the RestService_Page class
	 * @param  {[type]} apexResponse [description]
	 * @param  {[type]} targetDir    [description]
	 * @return {[type]}              [description]
	 */
	exports.writeDefinitionFiles = function(apexResponse, targetDir){
		_.each(apexResponse, function(item){
			writePageFile(item, targetDir);
		});
	}


	exports.readPageFiles = function(fileSources){
		//filter out the xml files from the filelist
		fileSources = filterOutUnneededFiles(fileSources);
		return fileSources.map(readPageFile);
	}

	exports.getPageUniqueIdFromFilename = function(filename){
		return filename.split('/').pop().split('.')[0];
	}

	return exports;
}
