#skuid-grunt

**skuid-grunt** is a toolkit that enables developers working with Skuid to extend their development processes to their Skuid pages.

##Purpose
At Skuid, we eat our own dogfood. The Skuid interface is built using the very software we produce. **skuid-grunt** was born to help our developers easily version and release Skuid pages. Not only does this support our development process, but it also affords you, our customer, the unique opportunity to bring your Skuid pages into the same source control as the rest of your Salesforce code.

##How it works
With the release of Banzai Update 7, the Skuid app now includes a REST API for working with Skuid pages. This API gives you a way to "push" and "pull" Skuid pages to and from any org with Banzai Update 7 (or above) installed. When pulling your Skuid pages, 2 files will be created in the directory you specify; a JSON file and an XML file. See the ```skuid-pull``` task for further information. These files can then be used to push your Skuid pages into the same or any other org running Skuid.

##Features
* Pull Skuid pages from any Salesforce org into your local filesystem.
* Push Skuid pages from a local filesystem to any Salesforce org.
* Generate a Skuid Page Pack that can be shared across orgs.

##Requirements

* [Node.js](https://nodejs.org/)
* [Grunt](http://gruntjs.com/getting-started)
* [Skuid Banzai Update 7 (v7.31 or higher)](http://www.skuidify.com/SkuidReleases) - installed in Salesforce orgs being pulled from AND pushed to

Before installing **skuid-grunt**, make sure that you have the above requirements installed. We also assume that you are using [MavensMate](http://mavensmate.com/) or the [Force.com IDE](https://developer.salesforce.com/page/Force.com_IDE_Installation) to do local Force.com development. You will need to get Grunt setup in your Force.com project's root directory, following the steps described in [Grunt's Getting Started guide](http://gruntjs.com/getting-started) to get a ```Gruntfile.js``` and a ```package.json``` setup in this diectory. 

You must also have a Salesforce **Connected App** setup in order for **skuid-grunt** to communicate with Salesforce via OAuth's Resource Owner Password Credentials flow. See [this tutorial](https://help.salesforce.com/apex/HTViewHelpDoc?id=connected_app_create.htm) for setting up a Salesforce Connected App - you only need to fill out the "Basic Information" and "API (Enable OAuth Settings)" sections. Click "Enable OAuth Settings" and for "Callback URL", enter ```https://localhost:3000``` (skuid-grunt will be using nforce to connect to Salesforce with the OAuth Resource Owner Password Credentials flow, so technically the Callback URL is irrelevant, but you need to specify at least one URL to create a Connected App). For "Selected OAuth Scopes", choose "Access and manage your data (api)".

Once you've saved your Connected App, you'll be presented with fields containing your newly-created OAuth client's "Consumer Key" and "Consumer Secret". You'll need to copy and paste these into your Gruntfile in the ```orgOptions``` object's ```clientId``` and ```clientSecret``` properties, respectively. 

##Installation
From your Force.com project's root directory, run the following to install **skuid-grunt**:

```bash
$ npm install skuid-grunt --save-dev
```

##Setup
Next, you'll need to create a Gruntfile (or modify your existing one) to configure **skuid-grunt** and add Grunt tasks.

###Example Gruntfile
```js
module.exports = function(grunt){
  /*
   * Enter the OAuth client and user-specific credentials needed to connect to Salesforce.
   * Alternatively, store this information in environment variables, e.g.
   *    'clientId': process.env.SKUID_GRUNT_CLIENT_ID
   */
  var orgOptions = {
    'clientId': 'demoCliId',
    'clientSecret': 'demoCliSec',
    'username': 'demoUsrnm',
    'password': 'demoPasswd'
  };
  grunt.initConfig({
    'skuid-pull':{
      'options': orgOptions,
      'dev':{
        options:{
          'dest': 'skuidpages/',
          'module':['Module1'], //can be array or comma separated values
        }
      }  
    },
    'skuid-push':{
      'options': orgOptions,
      'dev':{
         'files':{
            src: ['skuidpages/Module1*']
         }
      }
    }
  });

  //task that will pull your Skuid pages for Module1 from a developer org and push them
  //right into a production org
  grunt.registerTask('to-production', ['skuid-pull:dev', 'skuid-push:production']);

  grunt.loadNpmTasks('skuid-grunt');
}
```

*[Visit this link for more info about configuring Grunt Tasks](http://gruntjs.com/configuring-tasks)* 

##Running skuid-grunt

###Retrieving Skuid Pages from an org

```bash
$ grunt skuid-pull:dev
```
Assuming the above Gruntfile, all Skuid Pages in module `Module1` will be pulled down into your Force.com project into a `skuidpages` directory. This is entirely customizable: you can pull the pages into whatever directory you'd like.

###Pushing Skuid Pages into an org

```bash
$ grunt skuid-push:production
```
Assuming the above Gruntfile, all Skuid Pages in module `Module1` in your skuidpages/ directory will be pushed into the target org. Pages are uniquely identified by their Unique Id field. Any pages that do not exist in the destination org will be created; existing pages will be updated.

##Task Configuration

###skuid-pull
Pull Skuid pages from any Salesforce org with Skuid installed. This task will create 2 files per Skuid page for each module you specify. These files will be named ```ModuleName_PageName.json``` & ```ModuleName_PageName.xml```. The XML file is your Skuid page. You can copy that file and paste it directly into the Skuid XML Editor. The JSON file is additional metadata about your Skuid page that will be used in the **skuid-push** task.

* ```options.dest```: [String|Optional] The target directory where your page files will be written
* ```options.clientId```: [String|Required] The OAuth Client Id of the org you wish to connect
* ```options.clientSecret```: [String|Required] The OAuth Client Secret of the org you wish to connect
* ```options.username```: [String|Required] The username of the org you wish to connect
* ```options.password```: [String|Required] The password of the org you wish to connect 
* ```options.module```: [String or Array| Required] The Module(s) you want to pull down.
* ```options.nforceOptions```: [Object|Optional] Any additional [nforce](https://github.com/kevinohara80/nforce) options you wish to use

###skuid-push
Push Skuid pages from your local directory whether you just pulled them down or have checked out your code from source control. This task will take the page definitions that you specify in ```src``` and push them to your Salesforce org. Once the task is finished, you can log into you org and begin working directly on those pages!

* ```files.src```: [String or Array|Required] Path to directory that stores your Skuid page definitions, [examples here](http://gruntjs.com/configuring-tasks#files)
* ```options.clientId```: [String|Required] The OAuth Client Id of the org you wish to connect
* ```options.clientSecret```: [String|Required] The OAuth Client Secret of the org you wish to connect
* ```options.username```: [String|Required] The username of the org you wish to connect
* ```options.password```: [String|Required] The password of the org you wish to connect 
* ```options.nforceOptions```: [Object|Optional] Any additional [nforce](https://github.com/kevinohara80/nforce) options you wish to use

###skuid-page-pack
The configuration for this task is the same as ```skuid-pull```, however, the resulting file will be in the Page Pack format. This is a condensed format that can be included as a Static Resource. For information about how to use Page Packs with Skuid visit [this link](http://help.skuidify.com/m/page-assignments-and-overrides/l/245955-import-export-page-packs-and-modules). There are 2 extra options to use with this task. They are:
* ```options.extension```: [String|Optional] defaults to ```.json```. The extension that will be applied to the file. Use ```.resource``` for Static Resource format.
* ```options.nameMap```: [Object|Optional] Create a map from module name to desired filename. Example:
```js

{
  'skuid-page-pack':{
    'options':{
      'nameMap': {
        'Module1': 'Module1Filename'
      } 
    }
  }
}

```