import React from 'react';

import { IArtifact } from 'core/domain';
import { excludeAllTypesExcept, ArtifactTypePatterns, StageArtifactSelectorDelegate } from 'core/artifact';
import { IFormikStageConfigInjectedProps } from '../../FormikStageConfig';

export class BakeCDK8SConfigForm extends React.Component<IFormikStageConfigInjectedProps> {
  private getInputArtifact = () => {
    const stage = this.props.formik.values;
    if (!stage.inputArtifact) {
      return {
        account: '',
        id: '',
      };
    }
    return stage.inputArtifact;
  };

  public render() {
    const stage = this.props.formik.values;
    return (
      <div className="form-horizontal clearfix">
        <div className="container-fluid form-horizontal">
          <h4>CDK8S Options</h4>
          <StageArtifactSelectorDelegate
            artifact={this.getInputArtifact().artifact}
            excludedArtifactTypePatterns={excludeAllTypesExcept(ArtifactTypePatterns.GIT_REPO)}
            expectedArtifactId={this.getInputArtifact().id}
            helpKey="pipeline.config.bake.manifest.expectedArtifact"
            label="Expected Artifact"
            pipeline={this.props.pipeline}
            stage={stage}
            onArtifactEdited={(artifact: IArtifact) => {
              this.props.formik.setFieldValue('inputArtifact.id', null);
              this.props.formik.setFieldValue('inputArtifact.artifact', artifact);
              this.props.formik.setFieldValue('inputArtifact.account', artifact.artifactAccount);
            }}
            onExpectedArtifactSelected={(artifact: IArtifact) => {
              this.props.formik.setFieldValue('inputArtifact.id', artifact.id);
              this.props.formik.setFieldValue('inputArtifact.artifact', null);
            }}
          />
        </div>
      </div>
    );
  }
}
