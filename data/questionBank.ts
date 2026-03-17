export const questionBank = {
  nodejs: [
    // Conceptual
    "Explain Node.js event loop phases in order",
    "What is the difference between process.nextTick and setImmediate?",
    "How does Node.js handle CPU-intensive tasks without blocking the event loop?",
    "What is the role of libuv in Node.js?",
    "How does the cluster module improve scalability?",
    "Explain the difference between worker_threads and child_process",
    "How do streams work internally in Node.js?",
    "What is backpressure in streams and how do you handle it?",
    "Explain how Node.js module caching works",
    "What happens when a Promise resolves in the context of microtasks?",

    // Debugging / Practical
    "How would you debug a memory leak in a Node.js production app?",
    "How would you profile CPU usage in a Node.js service?",
    "What tools would you use to trace slow async operations?",
    "How do you handle uncaughtException vs unhandledRejection?",
    "How would you gracefully shut down a Node.js HTTP server?",

    // Scenario
    "Your Node.js API is handling 10k req/s but CPU spikes to 100%. What do you investigate first?",
    "A downstream service is slow. How do you prevent it from cascading into your Node.js app?",
    "How would you implement a connection pool for a third-party API in Node.js?",
    "You need to process 1 million records from a DB. How would you stream this in Node.js?",
    "How would you implement a retry mechanism with exponential backoff in Node.js?",
  ],

  javascript: [
    // Conceptual
    "Explain closures with a real-world example",
    "What is the difference between var, let, and const?",
    "Explain prototype chain and how inheritance works",
    "How does the JavaScript event loop differ from Node.js event loop?",
    "What is the difference between == and ===?",
    "Explain how WeakMap differs from Map and when to use it",
    "What is the temporal dead zone?",
    "How does async/await relate to generators internally?",
    "Explain how Promise.all, Promise.race, Promise.allSettled differ",
    "What is the difference between call, apply, and bind?",

    // Tricky / Edge Cases
    "What does 'this' refer to in an arrow function inside a class method?",
    "Why does typeof null return 'object'?",
    "What is the output of [1,2,3].map(parseInt) and why?",
    "Explain event delegation and why it's useful",
    "What happens if you throw inside a finally block?",

    // Practical
    "How would you debounce a search input in vanilla JS?",
    "How would you implement a deep clone without libraries?",
    "How would you detect and prevent circular references?",
    "How would you implement your own version of Promise.all?",
    "How would you memoize an expensive function?",
  ],

  system_design: [
    // Classic Distributed Systems
    "How would you design a URL shortener with 100M daily requests?",
    "How would you design a scalable notification service?",
    "How would you design a rate limiter for public APIs?",
    "How would you design a distributed job queue system?",
    "How would you design a highly available session store?",
    "How would you design a real-time collaborative editing system like Google Docs?",
    "How would you design a distributed cache like Redis?",
    "How would you design a search autocomplete system?",
    "How would you design a content delivery network (CDN)?",
    "How would you design a distributed message broker like Kafka?",

    // Data & Storage
    "How would you design a system that aggregates logs from 10,000 services?",
    "When would you choose SQL vs NoSQL for a social feed?",
    "How would you design a schema for a multi-tenant SaaS application?",
    "How would you handle hot partitions in a distributed database?",
    "How would you implement eventual consistency across microservices?",

    // Reliability & Scale
    "How would you make a payment service idempotent?",
    "What strategies would you use to achieve zero-downtime deployment?",
    "How would you design a circuit breaker pattern?",
    "How would you design a system for exactly-once delivery?",
    "How would you scale a monolith that's hitting its limits?",

    // Trade-offs
    "What are the trade-offs between a message queue and direct HTTP calls between services?",
    "When would you use event sourcing over traditional CRUD?",
    "What are the CAP theorem trade-offs and where does your design sit?",
  ],

  java: [
    // Concurrency
    "Explain the difference between HashMap, LinkedHashMap, and ConcurrentHashMap",
    "How does synchronized work internally with monitor locks?",
    "What is the difference between volatile and AtomicInteger?",
    "Explain ReentrantLock vs synchronized — when would you choose one over the other?",
    "What is a deadlock and how do you detect and prevent it in Java?",
    "What is the Fork/Join framework and when would you use it?",
    "Explain the Java memory model and happens-before relationships",

    // JVM Internals
    "What is JVM garbage collection and what are the different GC algorithms?",
    "How does the G1 garbage collector differ from ZGC?",
    "What is the difference between heap and metaspace?",
    "How does JIT compilation work in the JVM?",
    "What are the phases of class loading in Java?",

    // OOP & Design
    "When would you use an abstract class over an interface in Java?",
    "Explain the difference between Comparable and Comparator",
    "What is the diamond problem and how does Java handle it?",
    "Explain how generics work with type erasure",
    "What is the difference between checked and unchecked exceptions?",

    // Practical
    "How would you diagnose and fix a thread deadlock in production?",
    "How would you use CompletableFuture to run parallel tasks and combine results?",
    "Your Java app has high GC pauses. What would you investigate?",
  ],

  c: [
    // Memory
    "What happens when a pointer references freed memory (use-after-free)?",
    "Explain the difference between stack and heap memory",
    "What is a segmentation fault and what are common causes?",
    "What is a buffer overflow and how can it be exploited?",
    "What is the difference between malloc, calloc, and realloc?",
    "How does free() know how many bytes to release?",
    "What is a memory leak and how would you detect it in C?",

    // Pointers & Undefined Behavior
    "What is the difference between a null pointer and a dangling pointer?",
    "What is undefined behavior in C and give three examples?",
    "Explain pointer arithmetic and when it's safe",
    "What is the difference between const char* and char* const?",
    "What is a void pointer and when would you use it?",

    // Systems
    "Explain how virtual memory works at the OS level",
    "What is the difference between a process and a thread in C?",
    "How does fork() work and what does it copy?",
    "What is mmap and when would you use it over malloc?",
    "Explain how the C linker resolves symbols",
  ],

  databases: [
    // Indexing & Query
    "How does a B-tree index work internally?",
    "What is the difference between a clustered and non-clustered index?",
    "When would a query ignore an index?",
    "What is an index covering query and why is it faster?",
    "Explain cardinality and why it matters for index selection",

    // Transactions
    "What are the four ACID properties?",
    "Explain the four transaction isolation levels and their trade-offs",
    "What is a phantom read?",
    "How does MVCC (Multi-Version Concurrency Control) work?",
    "What is two-phase locking?",

    // Performance
    "How would you diagnose a slow SQL query in production?",
    "What is the N+1 query problem and how do you fix it?",
    "When would you use a materialized view?",
    "How does connection pooling work and why is it important?",
    "What is query plan caching and when does it backfire?",
  ],

  typescript: [
    // Type System
    "What is the difference between type and interface in TypeScript?",
    "Explain conditional types with an example",
    "What are mapped types and when would you use them?",
    "What is the infer keyword and how is it used?",
    "Explain the difference between unknown, any, and never",
    "What is a discriminated union and why is it useful?",

    // Advanced
    "How does TypeScript's structural typing differ from nominal typing?",
    "What are declaration merging and module augmentation?",
    "Explain the difference between covariance and contravariance in TypeScript",
    "How would you type a function that returns different types based on its argument?",

    // Practical
    "How would you type a deeply nested optional object without using any?",
    "How would you create a type-safe event emitter in TypeScript?",
    "How would you enforce that an API response matches a specific shape at runtime?",
  ],

  networking: [
    // Protocols
    "What happens when you type a URL and press Enter?",
    "Explain the TCP 3-way handshake",
    "What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?",
    "How does TLS handshake work?",
    "What is the difference between TCP and UDP and when do you choose UDP?",

    // APIs & Web
    "What is the difference between REST and GraphQL?",
    "Explain CORS and how you would configure it correctly",
    "What is WebSocket and how does it differ from HTTP long polling?",
    "How does DNS resolution work end-to-end?",
    "What is gRPC and when would you use it over REST?",

    // Security
    "What is a man-in-the-middle attack and how does TLS prevent it?",
    "Explain JWT — structure, signing, and common vulnerabilities",
    "What is the difference between authentication and authorization?",
    "How does OAuth2 flow work?",
  ],

  os_concepts: [
    "What is the difference between a process and a thread?",
    "Explain how context switching works",
    "What is a race condition and how do mutexes prevent it?",
    "Explain deadlock conditions (Coffman conditions)",
    "What is the difference between concurrency and parallelism?",
    "How does virtual memory work?",
    "What is the difference between paging and segmentation?",
    "Explain how the OS scheduler works (e.g., Round Robin, CFS)",
    "What is a system call and how does it transition from user to kernel space?",
    "What is copy-on-write and where is it used?",
  ],

  data_structures_algorithms: [
    // Concepts
    "Explain the difference between BFS and DFS and when to use each",
    "What is dynamic programming? Explain with an example",
    "How does a hash table handle collisions?",
    "What is amortized time complexity? Give an example",
    "Explain the difference between a min-heap and a max-heap",

    // Problem-solving approach
    "How would you detect a cycle in a linked list?",
    "How would you find the LCA of two nodes in a binary tree?",
    "How would you design an LRU cache?",
    "How would you implement a rate limiter using a sliding window?",
    "How would you merge K sorted arrays efficiently?",
  ],
} as const;

export type Topic = keyof typeof questionBank;
export type Question = (typeof questionBank)[Topic][number];

export type QuestionBankTopic = keyof typeof questionBank;

export function mapTopicToQuestionBankKey(topic: string): QuestionBankTopic | null {
  const normalized = topic.trim().toLowerCase();

  if (normalized === "node.js" || normalized === "nodejs") {
    return "nodejs";
  }

  if (normalized === "javascript") {
    return "javascript";
  }

  if (normalized === "system design" || normalized === "system_design") {
    return "system_design";
  }

  if (normalized === "java") {
    return "java";
  }

  if (normalized === "c") {
    return "c";
  }

  return null;
}

export function randomQuestionForTopic(topic: QuestionBankTopic) {
  const questions = questionBank[topic];
  const index = Math.floor(Math.random() * questions.length);
  return questions[index];
}
