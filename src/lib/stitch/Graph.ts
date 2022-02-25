class Graph {
	public referenceTable: paper.CurveLocation[] = [];
	public adjacencyList: number[][];

	constructor(curveLocations: paper.CurveLocation[]) {
		this.adjacencyList = new Array(curveLocations.length);
		this.referenceTable = curveLocations;
		this.adjacencyList.fill([]);
	}

	/**
	 *
	 * @param {paper.CurveLocation} cl1 vertex 1
	 * @param {paper.CurveLocation} cl2 vertex 2
	 * @param {boolean} sufficient whether the path finding algorithm will stop once all of the sufficient edges have been visited
	 * @returns {boolean} if the edge has been added
	 */
	public addEdge(
		cl1: paper.CurveLocation,
		cl2: paper.CurveLocation
	): boolean {
		if (cl1 === cl2) return false;

		const index1 = this.referenceTable.findIndex((value) => {
			if (value.point === cl1.point) return true;
			return false;
		});
		const index2 = this.referenceTable.findIndex((value) => {
			if (value.point === cl2.point) return true;
			return false;
		});

		if (index1 === -1 || index2 === -1) return false;

		this.adjacencyList[index1].push(index2);
		this.adjacencyList[index2].push(index1);
		return true;
	}

	/**
	 * @description helper function to depth-first fill a graph
	 * @param {number} i vertex to check
	 * @param {boolean[]} visited vertex visited status
	 */
	public recursionCheck(
		i: number,
		visited: boolean[],
		adj: number[][] = this.adjacencyList
	) {
		visited[i] = true;

		for (let node of adj[i]) {
			if (!visited[node]) this.recursionCheck(node, visited);
		}
	}

	/**
	 * @description hierholzer's algorithm to find the an eulorian path, with a sufficiency of the edges between the intersections
	 * @param {number} startingVertex vertex index to start from
	 * @returns {number[]} path to take
	 */
	public getEulorianPath(startingVertex = 0): paper.CurveLocation[] | false {
		let curVertex = startingVertex;

		let cPath: number[] = [];
		let ePath: number[] = [];

		cPath.push(curVertex);

		while (cPath.length > 0) {
			const u = cPath[cPath.length - 1];

			// all edges are visited
			if (this.adjacencyList[u].length === 0) {
				ePath.push(u);
				cPath.pop();
			} else {
				cPath.push(this.adjacencyList[u][0]);
				const index1 = u;
				const index2 = this.adjacencyList[u][0];
				this.removeEdge(index1, index2);
			}
		}

		return ePath.map((e) => this.referenceTable[e]);
	}

	/**
	 * @description removes the edge of an undirected graph, given 2 vertices
	 * @param u start vertex
	 * @param v end vertex
	 * @param adj adjacency list
	 */
	private removeEdge(
		u: number,
		v: number,
		adj: number[][] = this.adjacencyList
	) {
		if (adj[u].includes(v)) adj[u].splice(adj[u].indexOf(v), 1);
		if (adj[v].includes(u)) adj[v].splice(adj[v].indexOf(u), 1);
	}
}

export default Graph;
