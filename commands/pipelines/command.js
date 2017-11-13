/**
 * Created by nikolai on 24.8.16.
 */

const _           = require('lodash');
const request     = require('request');
const Q           = require('q');
const Pipeline    = require('./pipeline');


/**
 *
 * @param info = {url: '', repoName: '', repoOwner: '', token: ''}
 * @returns {*|promise}
 */
const getAllByUser = function (info) {
    let deferred = Q.defer();
    let url = `${info.url}/api/services/${info.repoOwner}/${encodeURIComponent(info.repoName)}`;
    let headers = {
        'Accept': 'application/json',
        'X-Access-Token': info.token
    };
    request.get({url: url, headers: headers}, function (err, httpRes, body) {
        if(err) {
            deferred.reject(err);
        }
        deferred.resolve(body);
    });
    return deferred.promise;
};

/**
 *
 * @param info - {url: '', repoName: '', repoOwner: '', pipelineName: '', token: ''}
 */
const getPipelineByName = function (info) {
    let deferred = Q.defer();
    getAllByUser(info)
        .then(function (res) {
            var pipeline = _.find(JSON.parse(res), {name: info.pipelineName});
            if(!pipeline) {
                deferred.reject(
                    new Error(`Pipeline with name ${info.pipelineName} wasn't found for owner ${info.repoOwner} and repo ${info.repoName}.`));
            }
            else {
                deferred.resolve(new Pipeline.Pipeline(pipeline));
            }
        }, function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};




const executePipeline = function (info) {
    let deferred = Q.defer();
    if (!_.isUndefined(info.pipelineName) && !_.isUndefined(info.repoName) && !_.isUndefined(info.repoOwner)){
        getPipelineByName(info).then((res) => {
           deferred.resolve(executePipelineById(info,res._id));
       }).catch((err) =>{
            deferred.reject(err);
        });
    }
    else if (!_.isUndefined(info.pipelineId)){
        deferred.resolve(executePipelineById(info,info.pipelineId));
    }
    else {
        deferred.reject(new Error("you must provide [pipelineid] or [pipelineName] [repoName] [repoOwner]"));
    }
    return deferred.promise;
};


const executePipelineById = function (info,pipelineId) {
    let deferred = Q.defer();
    let url = `${info.url}/api/builds/${pipelineId}`;
    let headers = {
        'Accept': 'application/json',
        'X-Access-Token': info.token
    };
    let payload = {
        branch: info.branch,
        options: {noCache:info.noCache,resetVolume:info.resetVolume},
        variables: extractVariables(info)
    };
    request.post({url: url, headers: headers , json:payload}, function (err, httpRes, body) {
        if(err) {
            deferred.reject(err);
        }
        deferred.resolve(body);
    });
    return deferred.promise;
};


function extractVariables(info) {
    let variables = {};
    for (let i = 0; i < info.variables.length-1; i++) {
        let key = info.variables[i];
        let val = info.variables[i+1];
        variables[key] = val.toString();
        i++;
    }
    return variables;
}


module.exports.getPipelineByName = getPipelineByName;
module.exports.getAllByUser = getAllByUser;
module.exports.executePipeline = executePipeline;
