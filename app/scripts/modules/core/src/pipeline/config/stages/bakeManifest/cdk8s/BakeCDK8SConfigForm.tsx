import React from 'react';

import { IArtifact } from 'core/domain';
import { excludeAllTypesExcept, ArtifactTypePatterns, StageArtifactSelectorDelegate } from 'core/artifact';
import { IFormikStageConfigInjectedProps } from '../../FormikStageConfig';
import { StageConfigField } from '../../common';
import { ReactSelectInput } from 'core/presentation';
import { CDK8SLanguages } from '../ManifestRenderers';

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

        <div className="container-fluid form-horizontal">
          <h4>Language Renderer</h4>
          <StageConfigField
            fieldColumns={3}
            label={'CDK8S Language'}
            helpKey={'pipeline.config.bake.manifest.languageRenderer'}
          >
            <ReactSelectInput
              clearable={false}
              onChange={(o: React.ChangeEvent<HTMLSelectElement>) => {
                this.props.formik.setFieldValue('language', o.target.value);
              }}
              value={stage.language}
              stringOptions={[CDK8SLanguages.PYTHON, CDK8SLanguages.TYPE_SCRIPT]}
            />
          </StageConfigField>
        </div>
      </div>
    );
  }
}
