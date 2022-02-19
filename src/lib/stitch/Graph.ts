class Graph {
	public referenceTable: paper.CurveLocation[] = [];
	public adjacencyList: number[][];

	constructor(curveLocations: paper.CurveLocation[]) {
		this.adjacencyList = new Array(curveLocations.length);
		this.referenceTable = curveLocations;
		for (let i = 0; i < curveLocations.length; i++) {
			this.adjacencyList[i] = [];
		}
	}

	/**
	 *
	 * @param cl1 vertex 1
	 * @param cl2 vertex 2
	 * @param sufficient whether the path finding algorithm will stop once all of the sufficient edges have been visited
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
	 * @description checks whether a path is a type of eulorian
	 * @returns 0 not eulorian; 1 eulorian cycle; 2 eulorian path
	 */
	private isEulorian(): number {
		if (!this.isConnected()) return 0;

		let numOdd = 0;

		for (const adj of this.adjacencyList) {
			if (adj.length % 2 === 1) numOdd++;
		}

		if (numOdd === 0) return 1;
		else if (numOdd === 2) return 2;

		return 0;
	}

	/**
	 * @description checks if a graph is connected
	 * @returns {boolean} if the vertecies in the graph that have edges > 0 are connected
	 */
	private isConnected(): boolean {
		let visited: boolean[] = new Array(this.adjacencyList.length);
		let i;

		for (i = 0; i < this.adjacencyList.length; i++) visited[i] = false;

		for (i = 0; i < this.adjacencyList.length; i++)
			if (this.adjacencyList[i].length !== 0) break;

		if (i === this.adjacencyList.length) return true;

		this.recursionCheck(i, visited);

		for (i = 0; i < this.adjacencyList.length; i++)
			if (visited[i] === false && this.adjacencyList[i].length > 0)
				return false;

		return true;
	}

	/**
	 * @description helper function for the isConnected() function
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
	 * @param closestPoint choose the vertex closest to this point, to start at with a eulorian cycle
	 * @returns {number[]} path to take
	 */
	public getEulorianPath(startingVertex = 0): paper.CurveLocation[] | false {
		const eulroianResult = this.isEulorian();
		let curVertex = startingVertex;

		// TODO: fix eurlorian result for custom starting point
		// // get point to start at closest point
		// if (eulroianResult === 1) {
		// 	// eulorian cycle, can start from anywhere
		// 	curVertex = startingVertex;
		// } else if (eulroianResult === 2) {
		// 	// if its a eulorian path, must choose one of the 2 odd vertecies
		// 	for (let i = 0; i < this.adjacencyList.length; i++) {
		// 		if (this.adjacencyList[i].length % 2 === 1) {
		// 			curVertex = i;
		// 			break;
		// 		}
		// 	}
		// } else {
		// 	console.log("reached here");
		// 	return false;
		// }

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

	private removeEdge(
		u: number,
		v: number,
		adj: number[][] = this.adjacencyList
	) {
		if (adj[u].includes(v)) adj[u].splice(adj[u].indexOf(v), 1);
		if (adj[v].includes(u)) adj[v].splice(adj[v].indexOf(u), 1);
	}

	// private removeVertex(
	// 	i: number,
	// 	adj: number[][] = this.adjacencyList,
	// 	ref: paper.CurveLocation[] = this.referenceTable
	// ) {
	// 	// remove vertex from vertex list
	// 	adj.splice(i, 1);
	// 	ref.splice(i, 1);

	// 	// remove vertex from edge list
	// 	for (let i = 0; i < adj.length; i++) {
	// 		for (let j = 0; j < adj[i].length; j++) {
	// 			if (adj[i][j] === i) adj[i].splice(j, 1);
	// 		}
	// 	}

	// 	// decrease all edge index references by 1 if above i
	// 	for (let i = 0; i < adj.length; i++) {
	// 		for (let j = 0; j < adj[i].length; j++) {
	// 			if (adj[i][j] > i) adj[i][j]--;
	// 		}
	// 	}
	// }
}

export default Graph;
