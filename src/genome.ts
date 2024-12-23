/**
 * Represents a chromosome containing genetic information stored as an array of 32-bit unsigned integers.
 * Each integer in the array represents a gene, and each bit within the integer can be mutated.
 */
export class Chromosome {
    /** Internal array storing the genetic information as 32-bit unsigned integers */
    private genes: Uint32Array;
    
    /** Default probability of a gene mutation occurring during reproduction */
    static mutation_probability: number = 0.01;
    
    /** Default probability of adding a new gene during mutation */
    static addition_probability: number = 0.001;

    /**
     * Creates a new Chromosome with the specified number of genes.
     * Each gene is initialized with a random 32-bit unsigned integer.
     * @param length - The number of genes to create
     */
    constructor(length: number) {
        this.genes = new Uint32Array(length);
        if (length > 0) {
            // Initialize each gene with a random value between 0 and 2^32-1
            for (let i = 0; i < length; i++) {
                this.genes[i] = Math.floor(Math.random() * 4294967295);
            }
        }
    }

    /**
     * Creates a deep copy of the chromosome.
     * @returns A new Chromosome instance with copied genes
     */
    copy(): Chromosome {
        const c = new Chromosome(0);
        c.genes = new Uint32Array(this.genes);
        return c;
    }

    toString(): string {
        return this.genes.toString();
    }

    get length(): number {
        return this.genes.length;
    }

    /**
     * Creates a new chromosome by combining genes from this chromosome and another.
     * The longer chromosome is considered dominant and determines the child's length.
     * Missing genes in the shorter chromosome are not used in the mixing process.
     * 
     * @param other - The chromosome to breed with
     * @returns A new Chromosome containing a mixture of genes from both parents
     */
    spawnWith(other: Chromosome): Chromosome {
        // Determine which chromosome is longer (dominant) and shorter (non-dominant)
        const [dom, nondom] = other.length > this.length ? 
            [other, this] : [this, other];

        // Create a child chromosome as a copy of the dominant parent
        const child = dom.copy();

        // For each gene position in the child
        for (let i = 0; i < child.length; i++) {
            // If this position exists in both parents
            if (i < nondom.length && Math.random() > 0.5) {
                try {
                    // 50% chance to take the gene from the non-dominant parent
                    child.genes[i] = nondom.genes[i];
                } catch (e) {
                    // Handle overflow silently as in Python version
                }
            }
        }
        return child;
    }

    /**
     * Calculates the genetic diversity between this chromosome and another.
     * For genes present in both chromosomes, calculates bit-by-bit differences.
     * For genes present in only one chromosome, uses the inverse of the gene
     * from the longer chromosome as the comparison value.
     * 
     * @param other - The chromosome to compare against
     * @returns A number between 0 and 1 representing the proportion of different bits
     */
    diversityWith(other: Chromosome): number {
        // Determine which chromosome is longer and shorter
        const [longer, shorter] = this.length > other.length ?
            [this.genes, other.genes] : [other.genes, this.genes];
            
        // Create an extended version of the shorter chromosome
        const extendedShorter = new Uint32Array(longer.length);
        extendedShorter.set(shorter);
        
        // For genes present only in the longer chromosome,
        // use the inverse of those genes for comparison
        for (let i = shorter.length; i < longer.length; i++) {
            extendedShorter[i] = ~longer[i];
        }
        
        // XOR the arrays to find differences
        const xored = new Uint32Array(longer.length);
        for (let i = 0; i < longer.length; i++) {
            xored[i] = longer[i] ^ extendedShorter[i];
        }
        
        // Count the number of 1 bits and divide by total number of bits
        const onesCount = countOnes(xored);
        return onesCount / (longer.length * 32);
    }

    /**
     * Mutates the chromosome by randomly flipping bits and potentially adding new genes.
     * 
     * The mutation probability can be > 1, which indicates multiple guaranteed mutations:
     * - The integer part determines the number of guaranteed mutation attempts
     * - The fractional part becomes the probability of an additional mutation
     * 
     * For example, a mutation probability of 2.5 means:
     * - 2 guaranteed mutation attempts
     * - 50% chance of a third mutation
     * 
     * @param mutationProb - Override for mutation probability (default: mutation_probability)
     * @param additionProb - Override for gene addition probability (default: addition_probability)
     * @returns This chromosome instance after mutation
     */
    mutate(mutationProb?: number, additionProb?: number): Chromosome {
        mutationProb = mutationProb ?? Chromosome.mutation_probability;
        additionProb = additionProb ?? Chromosome.addition_probability;

        let numMutations = 1;
        if (mutationProb >= 1.0) {
            // Extract the integer part as number of guaranteed mutations
            numMutations = Math.floor(mutationProb);
            // Use the fractional part as the probability
            mutationProb = mutationProb - numMutations;
            // If no fractional part, use 1.0 (guaranteed mutation)
            if (mutationProb === 0.0) mutationProb = 1.0;
        }

        // For each mutation attempt
        while (numMutations > 0) {
            numMutations--;
            if (Math.random() < mutationProb) {
                // Select a random gene and a random bit within that gene
                const idxGene = Math.floor(Math.random() * this.genes.length);
                const idxBit = Math.floor(Math.random() * 32);
                try {
                    // Flip the selected bit using XOR
                    this.genes[idxGene] = this.genes[idxGene] ^ (1 << idxBit);
                } catch (e) {
                    // Handle overflow silently
                }
            }
        }

        // Potentially add a new gene
        if (Math.random() < additionProb) {
            const newGenes = new Uint32Array(this.genes.length + 1);
            newGenes.set(this.genes);
            newGenes[this.genes.length] = Math.floor(Math.random() * 0xFFFFFFFF);
            this.genes = newGenes;
        }

        return this;
    }
}

/**
 * Represents a complete genome consisting of multiple chromosomes.
 * The shape property tracks the length of each chromosome.
 */
export class Genome {
    /** Array of chromosomes that make up this genome */
    private chromosomes: Chromosome[] = [];
    
    /** Array storing the length of each chromosome */
    private shape: number[];

    /**
     * Creates a new Genome with chromosomes of specified lengths.
     * @param lengths - Array specifying the length of each chromosome
     */
    constructor(lengths: number[]) {
        this.shape = [...lengths];
        this.chromosomes = lengths.map(len => new Chromosome(len));
    }

    toString(): string {
        return `(${this.chromosomes.map(c => '\n ' + c.toString()).join('')}\n)`;
    }

    /**
     * Creates a deep copy of the genome.
     * @returns A new Genome instance with copied chromosomes
     */
    copy(): Genome {
        const ret = new Genome([]);
        ret.chromosomes = this.chromosomes.map(c => c.copy());
        ret.shape = this.chromosomes.map(c => c.length);
        return ret;
    }

    /**
     * Gets the total number of genes across all chromosomes.
     * @returns Total number of genes in the genome
     */
    get numGenes(): number {
        return this.chromosomes.reduce((sum, c) => sum + c.length, 0);
    }

    /**
     * Calculates the average genetic diversity between this genome and another.
     * Only compares chromosomes that exist in both genomes.
     * The diversity is calculated as the average of the diversities of the
     * corresponding chromosomes.
     * 
     * @param other - The genome to compare against
     * @returns Average diversity across all compared chromosomes
     */
    diversityWith(other: Genome): number {
        // Determine which genome has fewer chromosomes
        const [shorter, longer] = this.chromosomes.length < other.chromosomes.length ?
            [this.chromosomes, other.chromosomes] : [other.chromosomes, this.chromosomes];

        let divTotal = 0;
        // Only compare chromosomes that exist in both genomes
        for (let i = 0; i < shorter.length; i++) {
            const divCurrent = shorter[i].diversityWith(longer[i]);
            divTotal += divCurrent;
        }
        return divTotal / shorter.length;
    }

    /**
     * Creates a new genome by combining chromosomes from this genome and another.
     * The number of chromosomes in the child matches this genome (considered the master).
     * Each chromosome in the child is created by spawning corresponding chromosomes
     * from both parents and then applying mutations.
     * 
     * @param other - The genome to breed with
     * @param mutationProbability - Override for mutation probability
     * @param additionProbability - Override for gene addition probability
     * @returns A new Genome containing mixed and mutated chromosomes
     */
    spawnWith(other: Genome, mutationProbability?: number, additionProbability?: number): Genome {
        mutationProbability = mutationProbability ?? Chromosome.mutation_probability;
        additionProbability = additionProbability ?? Chromosome.addition_probability;

        const child = new Genome([]);
        const newShape = [...this.shape];

        // For each chromosome in the master genome
        for (let i = 0; i < this.chromosomes.length; i++) {
            // If this chromosome exists in both parents
            if (i < other.chromosomes.length) {
                // Create a child chromosome and mutate it
                const childChromosome = this.chromosomes[i]
                    .spawnWith(other.chromosomes[i])
                    .mutate(mutationProbability, additionProbability);
                
                child.chromosomes.push(childChromosome);
                newShape[i] = childChromosome.length;
            }
        }
        child.shape = newShape;
        return child;
    }
}

/**
 * Counts the number of 1 bits in a Uint32Array by examining each bit
 * of each number in the array.
 * 
 * @param arr - The array to count bits in
 * @returns Total number of 1 bits across all integers in the array
 */
function countOnes(arr: Uint32Array): number {
    let count = 0;
    for (const num of arr) {
        let n = num;
        // Check each of the 32 bits
        for (let i = 0; i < 32; i++) {
            // If the rightmost bit is 1, increment count
            if ((n & 1) === 1) count++;
            // Right shift to examine the next bit
            n = n >> 1;
        }
    }
    return count;
}