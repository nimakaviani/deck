export enum ManifestRenderers {
  HELM2 = 'HELM2',
  HELM3 = 'HELM3',
  KUSTOMIZE = 'KUSTOMIZE',
  CDK8S = 'CDK8S',
}

export enum CDK8SLanguages {
  PYTHON = 'Python',
  TYPE_SCRIPT = 'TypeScript',
}

export const HELM_RENDERERS: Readonly<ManifestRenderers[]> = [ManifestRenderers.HELM2, ManifestRenderers.HELM3];
