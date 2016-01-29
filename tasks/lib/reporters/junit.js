var _ = require('underscore');
var successTemplate = '<testcase classname="<%= namespace %>" name="<%= methodName %>" assertions="1" time="<%= (time/1000).toFixed(2) %>"></testcase>';
var failureTemplate = '<testcase classname="<%= namespace %>" name="<%= methodName %>" assertions="1" time="<%= (time/1000).toFixed(2) %>"><failure type="failed" message="<%= message %>"><%= stackTrace %></failure></testcase>';
var header = '<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="skuid" errors="0" failures="<%= numFailures %>" tests="<%= numTestsRun %>" time="<%= (totalTime/1000).toFixed(2) %>">';
var footer = '</testsuite></testsuites>';

module.exports = function(deployResult){
	var runTestResult = deployResult.details.runTestResult,
		successes = runTestResult.successes,
		failures = runTestResult.failures;
	var document = _.template(header)(runTestResult);
	if(successes){
		document += _.map(successes, _.template(successTemplate)).join('');
	}
	if(failures){
		document += _.map(failures,_.template(failureTemplate)).join('');
	}
	document += _.template(footer)();
	return document;
};