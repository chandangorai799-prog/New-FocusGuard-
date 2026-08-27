import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using CDN fallback if local worker is not bundled
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker configuration notice:', e);
  }
}

export interface ParsedPdfData {
  fileName: string;
  fileSizeFormatted: string;
  numPages: number;
  text: string;
  base64: string;
  previewSnippet: string;
}

export interface SyllabusPreset {
  id: string;
  title: string;
  subject: string;
  description: string;
  text: string;
}

export const SAMPLE_SYLLABUS_PRESETS: SyllabusPreset[] = [
  {
    id: 'cs-dsa',
    title: 'Data Structures & Algorithms (B.Tech CS)',
    subject: 'Data Structures & Algorithms',
    description: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs & Dynamic Programming',
    text: `Course: Data Structures and Algorithms (CS301)
Department of Computer Science & Engineering

Unit 1: Linear Data Structures (Weightage: 20%)
- Arrays: 1D, 2D arrays, memory representation, sparse matrices
- Stacks & Queues: ADT, Array and Linked list implementations, Infix to Postfix conversion, Circular queues, Double-ended queues (Deque)
- Linked Lists: Singly, Doubly, Circular Linked lists, operations, reversal, cycle detection

Unit 2: Non-Linear Data Structures - Trees (Weightage: 25%)
- Binary Trees: Traversals (Inorder, Preorder, Postorder, Level-order)
- Binary Search Trees (BST): Insertion, Deletion, Search, LCA
- Balanced Trees: AVL Trees (Rotations, Balancing Factor), Red-Black Trees introduction
- Heaps: Min/Max Heap, Heapify, Priority Queues, HeapSort

Unit 3: Graphs and Networks (Weightage: 20%)
- Representation: Adjacency Matrix, Adjacency List
- Traversals: Breadth First Search (BFS), Depth First Search (DFS)
- Minimum Spanning Trees: Kruskal's and Prim's Algorithms
- Shortest Path: Dijkstra's algorithm, Bellman-Ford

Unit 4: Sorting, Searching & Hashing (Weightage: 15%)
- Searching: Linear, Binary Search, Exponential Search
- Sorting: QuickSort, MergeSort, RadixSort (Time and Space Complexity Analysis)
- Hashing: Hash functions, Collision resolution (Chaining, Open Addressing - Linear & Quadratic probing)

Unit 5: Advanced Algorithmic Paradigms (Weightage: 20%)
- Greedy Strategy: Fractional Knapsack, Huffman Coding
- Dynamic Programming: 0/1 Knapsack, Longest Common Subsequence (LCS), Matrix Chain Multiplication
- Backtracking: N-Queens problem, Subset Sum`,
  },
  {
    id: 'phys-12',
    title: 'Class 12 Physics (Board & Competitive Exam)',
    subject: 'Class 12 Physics',
    description: 'Electrostatics, Magnetism, Optics, Modern Physics & Semiconductor Devices',
    text: `Subject: Physics (Senior Secondary / Class XII)

Unit I: Electrostatics & Current Electricity (Weightage: 25%)
- Electric Charges, Coulomb's Law, Electric Field & Dipole, Gauss's Theorem and applications
- Electric Potential, Equipotential Surfaces, Capacitors and Capacitance, Energy stored in capacitor
- Ohm's law, Drift velocity, Kirchhoff's laws, Wheatstone bridge, Potentiometer

Unit II: Magnetic Effects of Current & AC (Weightage: 20%)
- Biot-Savart law, Ampere's circuital law, Force on current carrying conductor
- Electromagnetic Induction: Faraday's laws, Lenz's law, Eddy currents
- Alternating Currents: Peak and RMS values, LCR series circuit, Resonance, AC Generator & Transformer

Unit III: Optics & Wave Phenomena (Weightage: 25%)
- Ray Optics: Reflection, Refraction at spherical surfaces, Lens maker's formula, Total Internal Reflection, Optical instruments (Microscope & Telescope)
- Wave Optics: Huygens principle, Interference, Young's double slit experiment, Diffraction

Unit IV: Modern Physics & Dual Nature (Weightage: 15%)
- Dual nature of Radiation and Matter, Photoelectric effect, Einstein's equation, De Broglie hypothesis
- Atoms: Rutherford and Bohr models, Hydrogen spectrum
- Nuclei: Mass defect, Binding energy, Nuclear fission and fusion

Unit V: Electronic Devices (Weightage: 15%)
- Semiconductor materials, Energy bands, Intrinsic and Extrinsic semiconductors
- P-N Junction Diode: Forward & Reverse bias, I-V characteristics, Diode as a Rectifier, Zener Diode`,
  },
  {
    id: 'chem-org',
    title: 'Organic Chemistry Master Syllabus',
    subject: 'Organic Chemistry',
    description: 'Reaction Mechanisms, Hydrocarbons, Carbonyl Compounds & Biomolecules',
    text: `Subject: Advanced Organic Chemistry (Theory & Reactions)

Module 1: General Organic Chemistry & Reaction Intermediates (Weightage: 20%)
- Inductive effect, Electromeric effect, Resonance & Hyperconjugation
- Carbocations, Carbanions, Free Radicals, Electrophiles & Nucleophiles
- Aromaticity & Huckel's rule

Module 2: Hydrocarbons & Haloalkanes (Weightage: 20%)
- Alkanes, Alkenes (Markovnikov addition), Alkynes
- Nucleophilic Substitution: SN1 vs SN2 mechanisms, Stereochemistry
- Elimination reactions: E1 and E2 mechanisms, Saytzeff rule

Module 3: Alcohols, Phenols and Ethers (Weightage: 20%)
- Preparation and acidic nature of Alcohols and Phenols
- Reimer-Tiemann reaction, Kolbe's reaction
- Cleavage of Ethers by HI, Williamson ether synthesis

Module 4: Aldehydes, Ketones and Carboxylic Acids (Weightage: 25%)
- Nucleophilic addition to Carbonyls, Aldol Condensation, Cannizzaro Reaction
- Tollens' test, Fehling's test, Clemmensen and Wolff-Kishner reduction
- Acidity of Carboxylic acids, Esterification, Decarboxylation

Module 5: Biomolecules and Polymers (Weightage: 15%)
- Carbohydrates: Classification, Glucose and Fructose structures
- Proteins: Amino acids, Peptide bond, Denaturation of proteins
- Nucleic Acids: DNA and RNA components and secondary structure`,
  },
  {
    id: 'os-sys',
    title: 'Operating Systems & System Architecture',
    subject: 'Operating Systems',
    description: 'Process Management, Concurrency, Deadlocks, Memory & File Systems',
    text: `Course: Operating Systems Principles (CSE 304)

Chapter 1: Overview of Operating Systems (Weightage: 15%)
- OS Structure, System Calls, Dual-mode operations, Monolithic vs Microkernel architecture

Chapter 2: Process Management & CPU Scheduling (Weightage: 25%)
- Process Concept, PCB, Process States, Context Switching, Inter-Process Communication (IPC)
- Threads and Multithreading Models
- CPU Scheduling Algorithms: FCFS, SJF, SRTF, Round Robin, Priority Scheduling, Multi-level Queue

Chapter 3: Synchronization & Deadlocks (Weightage: 25%)
- Critical Section Problem, Peterson's Solution, Semaphores, Mutex Locks
- Classical IPC Problems: Dining Philosophers, Producer-Consumer, Reader-Writer
- Deadlocks: Necessary conditions, Resource Allocation Graphs, Deadlock Prevention, Avoidance (Banker's Algorithm), Detection and Recovery

Chapter 4: Memory Management (Weightage: 20%)
- Logical vs Physical Address, Swapping, Contiguous allocation, Paging, Segmentation
- Virtual Memory: Demand Paging, Page Faults, Page Replacement Algorithms (FIFO, LRU, Optimal)

Chapter 5: Storage & File Systems (Weightage: 15%)
- File System Interface, Directory Structure, Allocation Methods (Contiguous, Linked, Indexed)
- Disk Scheduling Algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK`,
  },
];

export const PdfParserService = {
  /**
   * Reads a File object as Base64 string (without the data URL prefix)
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Formats file size in readable units (KB, MB)
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  /**
   * Extracts text from a PDF file using pdfjs-dist, with resilient fallbacks
   */
  async extractTextFromPdf(file: File): Promise<ParsedPdfData> {
    const fileSizeFormatted = this.formatFileSize(file.size);
    const base64 = await this.fileToBase64(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });

      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      const textPieces: string[] = [];

      // Extract text page by page (limit to max 30 pages to prevent memory strain)
      const pagesToExtract = Math.min(numPages, 30);
      for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (pageText) {
            textPieces.push(`--- Page ${pageNum} ---\n${pageText}`);
          }
        } catch (pageErr) {
          console.warn(`Could not extract page ${pageNum}:`, pageErr);
        }
      }

      const fullText = textPieces.join('\n\n');
      const previewSnippet = fullText.slice(0, 300) + (fullText.length > 300 ? '...' : '');

      return {
        fileName: file.name,
        fileSizeFormatted,
        numPages,
        text: fullText,
        base64,
        previewSnippet: previewSnippet || `${file.name} (${numPages} pages ready for AI parsing)`,
      };
    } catch (err: any) {
      console.warn('PDF.js text extraction encountered an issue, falling back to base64 transmission:', err);

      return {
        fileName: file.name,
        fileSizeFormatted,
        numPages: 1,
        text: '',
        base64,
        previewSnippet: `Document "${file.name}" loaded successfully. Ready for AI Syllabus Analysis.`,
      };
    }
  },
};
