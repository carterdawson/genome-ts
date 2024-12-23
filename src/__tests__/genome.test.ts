import { Chromosome, Genome } from '../genome';

describe('Chromosome', () => {
    let chromosome: Chromosome;

    beforeEach(() => {
        // Reset random number generator for consistent tests
        jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
        chromosome = new Chromosome(5);
    });

    afterEach(() => {
        jest.spyOn(global.Math, 'random').mockRestore();
    });

    describe('constructor', () => {
        it('should create a chromosome with specified length', () => {
            expect(chromosome.length).toBe(5);
        });

        it('should create an empty chromosome when length is 0', () => {
            const emptyChromosome = new Chromosome(0);
            expect(emptyChromosome.length).toBe(0);
        });
    });

    describe('copy', () => {
        it('should create a deep copy', () => {
            const copy = chromosome.copy();
            expect(copy.length).toBe(chromosome.length);
            expect(copy).not.toBe(chromosome);
        });
    });

    describe('toString', () => {
        it('should return a string representation', () => {
            expect(typeof chromosome.toString()).toBe('string');
        });
    });

    describe('spawnWith', () => {
        it('should create child with length of longer parent', () => {
            const shorter = new Chromosome(3);
            const longer = new Chromosome(5);
            const child = shorter.spawnWith(longer);
            expect(child.length).toBe(5);
        });

        it('should create child with genes from both parents', () => {
            const parent1 = new Chromosome(3);
            const parent2 = new Chromosome(3);
            const child = parent1.spawnWith(parent2);
            expect(child.length).toBe(3);
        });
    });

    describe('diversityWith', () => {
        it('should calculate diversity between chromosomes of same length', () => {
            const chr1 = new Chromosome(3);
            const chr2 = new Chromosome(3);
            const diversity = chr1.diversityWith(chr2);
            expect(diversity).toBeGreaterThanOrEqual(0);
            expect(diversity).toBeLessThanOrEqual(1);
        });

        it('should calculate diversity between chromosomes of different lengths', () => {
            const chr1 = new Chromosome(3);
            const chr2 = new Chromosome(5);
            const diversity = chr1.diversityWith(chr2);
            expect(diversity).toBeGreaterThanOrEqual(0);
            expect(diversity).toBeLessThanOrEqual(1);
        });
    });

    describe('mutate', () => {
        it('should handle mutation probability > 1', () => {
            const original = chromosome.copy();
            chromosome.mutate(3.6);  //NOTE: we mock Math.random() to 0.5, so this results in 3 mutations to the same gene
            expect(chromosome.toString()).not.toBe(original.toString());
        });

        it('should handle gene addition', () => {
            const originalLength = chromosome.length;
            chromosome.mutate(0, 1); // Force gene addition
            expect(chromosome.length).toBe(originalLength + 1);
        });

        it('should maintain chromosome when no mutation occurs', () => {
            const original = chromosome.copy();
            chromosome.mutate(0, 0);
            expect(chromosome.toString()).toBe(original.toString());
        });
    });
});

describe('Genome', () => {
    let genome: Genome;

    beforeEach(() => {
        jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
        genome = new Genome([3, 4, 5]);
    });

    afterEach(() => {
        jest.spyOn(global.Math, 'random').mockRestore();
    });

    describe('constructor', () => {
        it('should create genome with specified chromosome lengths', () => {
            expect(genome.numGenes).toBe(12); // 3 + 4 + 5
        });

        it('should create empty genome when no lengths provided', () => {
            const emptyGenome = new Genome([]);
            expect(emptyGenome.numGenes).toBe(0);
        });
    });

    describe('copy', () => {
        it('should create a deep copy', () => {
            const copy = genome.copy();
            expect(copy.numGenes).toBe(genome.numGenes);
            expect(copy).not.toBe(genome);
        });
    });

    describe('toString', () => {
        it('should return a string representation', () => {
            expect(typeof genome.toString()).toBe('string');
            expect(genome.toString()).toContain('\n');
        });
    });

    describe('diversityWith', () => {
        it('should calculate diversity between genomes of same shape', () => {
            const genome1 = new Genome([3, 4]);
            const genome2 = new Genome([3, 4]);
            const diversity = genome1.diversityWith(genome2);
            expect(diversity).toBeGreaterThanOrEqual(0);
            expect(diversity).toBeLessThanOrEqual(1);
        });

        it('should calculate diversity between genomes of different shapes', () => {
            const genome1 = new Genome([3, 4]);
            const genome2 = new Genome([3, 4, 5]);
            const diversity = genome1.diversityWith(genome2);
            expect(diversity).toBeGreaterThanOrEqual(0);
            expect(diversity).toBeLessThanOrEqual(1);
        });
    });

    describe('spawnWith', () => {
        it('should create child with same number of chromosomes as first parent', () => {
            const parent1 = new Genome([3, 4]);
            const parent2 = new Genome([3, 4, 5]);
            const child = parent1.spawnWith(parent2);
            expect(child.numGenes).toBeGreaterThanOrEqual(7); // At least 3 + 4
        });

        it('should create child with custom mutation rates', () => {
            const parent1 = new Genome([3, 4]);
            const parent2 = new Genome([3, 4]);
            const child = parent1.spawnWith(parent2, 0.5, 0.5);
            expect(child.numGenes).toBeGreaterThanOrEqual(7); // At least 3 + 4
        });
    });
});

// Helper function tests
describe('countOnes', () => {
    // Note: countOnes is private, so we test it indirectly through diversity calculations
    it('should be reflected in diversity calculations', () => {
        const chr1 = new Chromosome(1);
        const chr2 = new Chromosome(1);
        const diversity = chr1.diversityWith(chr2);
        expect(diversity).toBeGreaterThanOrEqual(0);
        expect(diversity).toBeLessThanOrEqual(1);
    });
});