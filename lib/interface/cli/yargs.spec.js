const yargs  =require('yargs')

describe('yargs', () => {
    describe('Boolean issue', () => {
        it('should be false (bool1)', () => {
            let argv = yargs([])
                .option('bool1', {
                    default: false,
                    type: 'boolean',
                })
                .option('bool2', {})
                .argv;
            expect(argv.bool1).toEqual(false);
        });
        it('should be true (bool1)', () => {
            let argv = yargs(['--bool1'])
                .option('bool1', {
                    default: false,
                    type: 'boolean',
                })
                .option('bool2', {})
                .argv;
            expect(argv.bool1).toEqual(true);
        });
        it('should be true (bool2)', () => {
            let argv = yargs(['--bool2'])
                .option('bool1', {
                    default: false,
                    type: 'boolean',
                })
                .option('bool2', {})
                .argv;
            expect(argv.bool2).toEqual(true);
        });
    });
});
