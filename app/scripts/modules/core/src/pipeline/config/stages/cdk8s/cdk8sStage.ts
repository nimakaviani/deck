import { Registry } from 'core/registry';
import { ExecutionDetailsTasks } from '../common';

import { CDK8sStageConfig } from './CDK8sStageConfig';
import { CDK8sExecutionDetails } from './CDK8sExecutionDetails';
import { IUpstreamFlagProvidedValidationConfig } from '../../validation/upstreamHasFlagValidator.builder';

Registry.pipeline.registerStage({
  label: 'CDK8s Config',
  description: 'Transpile against AWS CDK8s',
  key: 'cdk8sConfig',
  restartable: false,
  component: CDK8sStageConfig,
  executionDetailsSections: [CDK8sExecutionDetails, ExecutionDetailsTasks],
  validators: [
    {
      type: 'repositoryInformationProvided',
      getMessage: (labels: any[]) => `
        This stage requires one of the following triggers to locate your CDK8s:
        <ul>${labels.map(label => `<li>${label}</li>`)}</ul>
        `,
    } as IUpstreamFlagProvidedValidationConfig,
  ],
});
