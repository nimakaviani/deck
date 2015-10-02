'use strict';

let angular = require('angular');

module.exports = angular.module('spinnaker.pipelines.stage.pipeline', [
  require('./pipelineStage.js'),
  require('../stage.module.js'),
  require('../core/stage.core.module.js'),
  require('../../../../core/cache/cacheInitializer.js'),
  require('../../../../core/cache/infrastructureCaches.js'),
  require('../../../../utils/timeFormatters.js'),
  require('../../services/pipelineConfigService.js'),
  require('./pipelineExecutionDetails.controller.js'),
  require('../../../../core/application/service/applications.read.service.js'),
]).name;
