export enum ManifestRenderers {
  HELM2 = 'HELM2',
  HELM3 = 'HELM3',
  KUSTOMIZE = 'KUSTOMIZE',
  CDK8S = 'CDK8S',
}

export const HELM_RENDERERS: Readonly<ManifestRenderers[]> = [ManifestRenderers.HELM2, ManifestRenderers.HELM3];
