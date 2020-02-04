const Command = require('../../Command');
const _ = require('lodash');
const DEFAULTS = require('../../defaults');
const { prepareKeyValueFromCLIEnvOption } = require('../../helpers/general');
const { extractImages } = require('../../helpers/image');
const Output = require('../../../../output/Output');
const getRoot = require('../root/get.cmd');
const Promise = require('bluebird');
const { sdk } = require('../../../../logic');

const IMAGE_FIELDS_TO_SELECT = 'internalName tags internalImageId created size imageDisplayName metadata sha';

const command = new Command({
    command: 'images [id..]',
    aliases: ['img', 'image'],
    parent: getRoot,
    description: 'Get a specific image or an array of images',
    usage: 'Passing [id] argument will cause a retrieval of a specific image.\n In case of not passing [id] argument, a list will be returned',
    webDocs: {
        category: 'Images',
        title: 'Get Image',
    },
    builder: (yargs) => {
        return yargs
            .positional('id', {
                describe: 'Docker Image id',
                coerce: (value) => value,
            })
            .option('limit', {
                describe: 'Limit amount of returned results',
                default: DEFAULTS.GET_LIMIT_RESULTS,
            })
            .option('all', {
                alias: 'a',
                describe: 'Return images from all possible registries (by default only r.cfcr.io images will be returned)',
                default: false,
                type: 'boolean',
            })
            .option('label', {
                describe: 'Filter by a list of annotated labels',
                alias: 'l',
                default: [],
            })
            .option('tag', {
                describe: 'Filter by a list of tags',
                alias: 't',
                type: Array,
                default: [],
            })
            .option('sha', {
                describe: 'Filter by specific commit sha',
                alias: 's',
            })
            .option('image-name', {
                describe: 'Filter by specific image name',
                type: 'array',
                alias: 'name',
            })
            .option('branch', {
                describe: 'Filter by specific branch',
                type: 'array',
            })
            .option('page', {
                describe: 'Paginated page',
                default: DEFAULTS.GET_PAGINATED_PAGE,
            })
            .example('codefresh get image ID', 'Get image ID')
            .example('codefresh get images', 'Get all images')
            .example('codefresh get images --image-name node', "Get all images that their name contains the word 'node'")
            .example('codefresh get images -l key1=value1', "Get all images that are annotated with 'value1' for 'key1'");
    },
    handler: async (argv) => {
        const imageIds = argv.id;
        const labels = prepareKeyValueFromCLIEnvOption(argv.label);
        const tags = argv.tag;
        const sha = argv.sha;
        const limit = argv.limit;
        const type = argv.type;
        const branch = argv.branch;
        const allRegistries = argv.all;
        const offset = (argv.page - 1) * limit;
        const imageName = argv['image-name'];
        let filterRegistries;
        if (!allRegistries) {
            filterRegistries = DEFAULTS.CODEFRESH_REGISTRIES;
        }

        let images = [];
        // TODO:need to decide for one way for error handeling
        if (!_.isEmpty(imageIds)) {
            images = await Promise.map(imageIds, id => sdk.images.get({
                id,
                allRegistries,
            }));
        } else {
            images = await sdk.images.list({
                metadata: labels,
                tag: tags,
                sha,
                limit,
                type,
                branch,
                imageDisplayNameRegex: imageName,
                offset,
                select: IMAGE_FIELDS_TO_SELECT,
            });
            images = images.docs;
        }
        Output.print(extractImages(images, filterRegistries));
    },
});

module.exports = command;
