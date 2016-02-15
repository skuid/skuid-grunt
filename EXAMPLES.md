#Example configurations for skuid-grunt

These are just a few examples of how you could configure skuid-grunt to push and pull your Skuid Pages between orgs. They have been written as 'drop in' Gruntfiles, but can be deconstructed and used in any Gruntfile. 

### Pull from ONE developer org and deploy to MULTIPLE production orgs
```bash
$ grunt push-multi
```
The following example demonstrates how skuid-grunt can be used for automated deployments to multiple orgs. For example, you might see this in a CD (Continuous Deployment) process which pulls pages from a developer org and pushes them out to production, qa and staging environments at the same time. You could also cut out the pull and, for instance, push pages from a source control repository. 
```js
module.exports = function(grunt){

  var orgOptions = {
    'clientId': 'demoCliId',
    'clientSecret': 'demoCliSec',
  };

  //we'll define a variable to hold our production page config
  //so we don't have to copy and paste every time

  var productionPages = { src: ['skuidpages/ModuleToPush*'] };

  grunt.initConfig({
    'skuid-pull':{
      'options': orgOptions,
      'dev':{
        options:{
          'username': 'someUsername',
          'password': 'somePasswordandSecurityToken'
          'dest': 'skuidpages/',
          'module':['Module1'], //can be array or comma separated values
        }
      }  
    },
    'skuid-push':{
      //these are task level options, meaning they will be use for all targets
      //that we've defined below
      'options': orgOptions,
      'production':{
      	 'options':{
			username: 'productionUser',
			password: 'productionPasswordandSecurityToken'
      	 },
         'files': productionPages
      },
      'staging':{
      	 'options':{
			username: 'stagingUser',
			password: 'stagingPasswordandSecurityToken'
      	 },
         'files': productionPages
      },
	  'qa':{
      	 'options':{
			username: 'qaUser',
			password: 'qaPasswordandSecurityToken'
      	 },
         'files': productionPages
      },
    }
  });

  //register a task that will pull your pages from a central developer org and push them to multiple
  //production orgs (production, staging and qa)
  grunt.registerTask('push-multi', ['skuid-pull:dev', 'skuid-push:production','skuid-push:staging', 'skuid-push:qa']);

  grunt.loadNpmTasks('skuid-grunt');
};
```

### Deploying a single page to a developer org

```bash
$ grunt skuid-push:single --page="SomeSingleSkuidPage.xml"
```

One of the great things about Grunt is that your Gruntfile is interperated at runtime. This allows you to build dynamic tasks and targets using Grunt's options framework and plain old JavaScript. Below you will see how we can configure a Grunt target to push one or more pages to an org based on options passed at runtime!
```js
module.exports = function(grunt){

  var orgOptions = {
    'clientId': 'demoCliId',
    'clientSecret': 'demoCliSec',
  };


  grunt.initConfig({
    'skuid-push':{
      'options': orgOptions,
      'single':{
      	 'options':{
			username: 'developerUsername',
			password: 'developerPasswordandSecurityToken'
      	 },
         'files': {
         	//after the Gruntfile is evaluated, src will equal
         	//either the globbing pattern specified with the --page
         	//option (if avaliable) or fall back to all pages 
         	'src': [grunt.option('page') || 'skuidpages/*']
         }
      }
    }
  });

  //register 
  grunt.registerTask('push-single-page', ['skuid-push:single']);

  grunt.loadNpmTasks('skuid-grunt');
};
```

###Dynamic targets

```bash
$ grunt dynamic --targets=qa,staging
```
Following our previous examples, perhaps we only want to push to our non-production orgs so that our QA team has a chance to approve our changes. At the same time, we don't want to register multiple tasks for every combination of the 3 (or more) orgs we could possible deploy to. In this example, we use grunt.option in a more interesting way.


```js
module.exports = function(grunt){
	/* previous example's configuration here */

	grunt.loadNpmTasks('skuid-grunt');

	if(grunt.option('targets')){
		//split the list of options we passed in
		var envs = grunt.option('targets').split(',');
		//create a list of target definitions based off the list
		var targets = envs.map(function(env){
			return 'skuid-push:' + env;
		});
		grunt.registerTask('dynamic', targets);
	}
};

```