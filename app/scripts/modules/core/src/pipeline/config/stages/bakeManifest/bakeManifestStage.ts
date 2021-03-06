import { ArtifactReferenceService, ExecutionArtifactTab, ExpectedArtifactService } from 'core/artifact';
import { IValidatorConfig } from '../../validation/PipelineConfigValidator';
import { ExecutionDetailsTasks } from '../common';

import { IArtifact, IStage, IPipeline, IStageOrTriggerTypeConfig } from 'core/domain';

import { Registry } from 'core/registry';

import { BakeManifestConfig } from './BakeManifestConfig';
import { BakeManifestDetailsTab } from './BakeManifestDetailsTab';
import { ManualExecutionBakeManifest } from './ManualExecutionBakeManifest';
import { ICustomValidator } from '../../validation/PipelineConfigValidator';
import { RequiredFieldValidator, IRequiredFieldValidationConfig } from '../../validation/requiredField.validator';

export const BAKE_MANIFEST_STAGE_KEY = 'bakeManifest';
const requiredField = (
  _pipeline: IPipeline,
  stage: IStage,
  _validator: IValidatorConfig,
  _config: IStageOrTriggerTypeConfig,
): string => {
  if (stage.templateRenderer !== 'HELM2' && stage.templateRenderer !== 'HELM3') {
    return '';
  }

  return new RequiredFieldValidator().validate(
    _pipeline,
    stage,
    { fieldLabel: 'Name', fieldName: 'outputName' } as IRequiredFieldValidationConfig,
    _config,
  );
};

Registry.pipeline.registerStage({
  label: 'Bake (Manifest)',
  description: 'Bake a manifest (or multi-doc manifest set) using a template renderer such as Helm.',
  key: BAKE_MANIFEST_STAGE_KEY,
  component: BakeManifestConfig,
  producesArtifacts: true,
  cloudProvider: 'kubernetes',
  executionDetailsSections: [BakeManifestDetailsTab, ExecutionDetailsTasks, ExecutionArtifactTab],
  artifactExtractor: (fields: string[]) =>
    ExpectedArtifactService.accumulateArtifacts<IArtifact>(['inputArtifacts'])(fields).map((a: IArtifact) => a.id),
  artifactRemover: (stage: IStage, artifactId: string) => {
    ArtifactReferenceService.removeArtifactFromFields(['expectedArtifactId'])(stage, artifactId);

    const artifactDoesNotMatch = (artifact: IArtifact) => artifact.id !== artifactId;
    stage.expectedArtifacts = (stage.expectedArtifacts ?? []).filter(artifactDoesNotMatch);
    stage.inputArtifacts = (stage.inputArtifacts ?? []).filter(artifactDoesNotMatch);
  },
  validators: [{ type: 'custom', validate: requiredField } as ICustomValidator],
  manualExecutionComponent: ManualExecutionBakeManifest,
});
