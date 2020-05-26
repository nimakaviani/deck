import React from 'react';

import { FormikStageConfig } from '../FormikStageConfig';
import { IStageConfigProps } from '../common';

export const CDK8sStageConfig: React.ComponentType<IStageConfigProps> = stageConfigProps => (
  <FormikStageConfig
    {...stageConfigProps}
    onChange={stageConfigProps.updateStage}
    render={() => <div className="form-horizontal"></div>}
  />
);
