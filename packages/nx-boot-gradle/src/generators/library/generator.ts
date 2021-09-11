import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { NxBootGradleGeneratorSchema } from './schema';

interface NormalizedSchema extends NxBootGradleGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];

  groupId: string;
  projectVersion: string;
  packageName: string;
  applicationClassName: string;
  applicationClassDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: NxBootGradleGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const packageName = 'com.example.demo';
  const applicationClassName = 'DemoApplication';
  const applicationClassDirectory = 'com/example/demo';

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    packageName,
    applicationClassName,
    applicationClassDirectory,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export default async function (
  tree: Tree,
  options: NxBootGradleGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@jnxplus/nx-boot-gradle:build',
      },
      serve: {
        executor: '@jnxplus/nx-boot-gradle:serve',
      },
      test: {
        executor: '@jnxplus/nx-boot-gradle:test',
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  addLibToGradleSetting(tree, normalizedOptions);
  await formatFiles(tree);
}

function addLibToGradleSetting(tree: Tree, options: NormalizedSchema) {
  const filePath = `settings.gradle`;
  const settingsContent = tree.read(filePath, 'utf-8');

  const regex = /.*rootProject\.name.*/;
  const newSettingsContent = settingsContent.replace(
    regex,
    `$&\ninclude('libs:${options.projectName}')`
  );
  tree.write(filePath, newSettingsContent);
}