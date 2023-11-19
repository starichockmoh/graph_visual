import DisjointSet from './set';
import PriorityQueue from './priority';
import { GraphData } from 'react-d3-graph';

type KeyType = string | number;
type VertexItemType = {
  weight: number;
  value: KeyType;
};

export interface IEdge {
  weight: number;
  from: KeyType;
  to: KeyType;
}

export type IVertex = {
  [key in KeyType]: Array<VertexItemType>;
};

export default class Graph {
  private vertices: IVertex;
  private isOrient: boolean;
  public constructor(isOrient?: boolean, vertices?: IVertex) {
    this.vertices = vertices ?? {};
    this.isOrient = Boolean(isOrient);
  }

  public copy(graph: Graph) {
    this.isOrient = graph.isOrient;
    this.vertices = graph.vertices;
  }

  public getAllVertices() {
    return Object.keys(this.vertices);
  }

  public getVertices() {
    return this.vertices;
  }

  public getAllEdges() {
    return Object.entries(this.vertices)
      .map(([key, value]) =>
        value.map((v) => ({
          weight: v.weight,
          from: key,
          to: v.value,
        })),
      )
      .flat() as Array<IEdge>;
  }

  public getIsOrient() {
    return this.isOrient;
  }

  public getD3Data() {
    const data: GraphData<any, any> = {
      nodes: Object.keys(this.vertices).map((vert) => ({
        id: vert,
      })),
      links: Object.entries(this.vertices)
        .map(([key, value]) => {
          return value.map((v) => {
            return {
              source: key,
              target: v.value,
              color: '#2f6bbe',
              strokeWidth: 2,
              markerWidth: 5,
            };
          });
        })
        .flat(),
    };
    const newLinks: typeof data.links = [];
    const prevLinks = data.links;
    prevLinks.forEach((link) => {
      if (
        !newLinks.find(
          (l) => l.source === link.target && l.target === link.source,
        )
      ) {
        newLinks.push(link);
      }
    });
    return {
      nodes: data.nodes,
      links: newLinks,
    };
  }

  public print() {
    console.log(this.vertices);
  }

  public degreeOfOutcome(vertex: KeyType) {
    if (!this.isOrient) throw new Error('Граф неориентрованный!');
    if (!(vertex in this.vertices)) throw new Error('Такой вершины нет!');
    else return this.vertices[vertex].length;
  }

  public printLoopsVertices() {
    if (!this.isOrient) throw new Error('Граф неориентрованный!');
    const loops = Object.entries(this.vertices).filter(([key, arr]) =>
      arr.find((el) => el.value === key),
    );
    if (!loops.length) console.log('Петель нет');
    else loops.forEach((l) => console.log(l[0] + ' '));
  }

  public intersection(graph: Graph) {
    const interGraph = new Graph();
    Object.entries(this.vertices).forEach(([key, arr]) => {
      if (key in graph.vertices) {
        interGraph.addVertex(key);
        const graphArr = graph.vertices[key];
        arr.forEach((el) => {
          if (graphArr.find((grEl) => el.value === grEl.value)) {
            interGraph.addVertex(el.value);
            interGraph.addEdge(key, el.value);
          }
        });
      }
    });
    return interGraph;
  }

  async bfs(
    startVertex: KeyType,
    badVertex: KeyType,
    delay?: number,
    setD3Data?: (v: string, parentV: string) => void,
    setStack?: (arr: Array<string>) => void,
    setVisited?: (v: string) => void,
  ) {
    if (startVertex === badVertex) {
      throw new Error(`Начальная вершина совпадает с нежелательной`);
    }
    let list = this.vertices;
    let queue = [startVertex];
    let visited = { [startVertex]: 1 };

    // кратчайшее расстояние от стартовой вершины
    let distance = { [startVertex]: 0 };
    // предыдущая вершина в цепочке
    let previous: { [key in string]: KeyType | null } = { [startVertex]: null };

    async function processItem(neighbour: VertexItemType, vertex: string) {
      // Simulate a delay of 1 second using setTimeout and a Promise
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!visited[neighbour.value] && neighbour.value !== badVertex) {
            visited[neighbour.value] = 1;
            if (setVisited) setVisited(neighbour.value as string);
            if (setD3Data) setD3Data(neighbour.value as string, vertex);
            queue.push(neighbour.value);
            // сохраняем предыдущую вершину
            previous[neighbour.value] = vertex;
            // сохраняем расстояние
            distance[neighbour.value] = distance[vertex] + 1;
          }
          resolve();
        }, delay ?? 1000);
      });
    }

    async function processArray(array: Array<VertexItemType>, vertex: string) {
      for (let i = 0; i < array.length; i++) {
        await processItem(array[i], vertex);
      }
    }

    async function handleVertex(vertex: KeyType) {
      let neighboursList = list[vertex];

      await processArray(neighboursList, vertex as string);
    }

    // перебираем вершины из очереди, пока она не опустеет
    while (queue.length) {
      if (setStack) setStack(queue as Array<string>);
      let activeVertex = queue.shift();
      await handleVertex(activeVertex as KeyType);
    }

    return { distance, previous };
  }

  async dfs(
    startVertex: KeyType,
    badVertex: KeyType,
    delay?: number,
    setD3Data?: (v: string, parentV: string) => void,
    setStack?: (arr: Array<string>) => void,
    setVisited?: (v: string) => void,
  ) {
    let list = this.vertices; // список смежности
    console.log(list);
    let stack = [startVertex]; // стек вершин для перебора
    let visited = { [startVertex]: 1 }; // посещенные вершины

    // кратчайшее расстояние от стартовой вершины
    let distance = { [startVertex]: 0 };
    // предыдущая вершина в цепочке
    let previous: { [key in string]: KeyType | null } = { [startVertex]: null };

    async function processItem(neighbour: VertexItemType, vertex: string) {
      // Simulate a delay of 1 second using setTimeout and a Promise
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!visited[neighbour.value] && neighbour.value !== badVertex) {
            // отмечаем вершину как посещенную
            visited[neighbour.value] = 1;
            if (setVisited) setVisited(neighbour.value as string);
            if (setD3Data) setD3Data(neighbour.value as string, vertex);
            // добавляем в стек
            stack.push(neighbour.value);
            previous[neighbour.value] = vertex;
            // сохраняем расстояние
            distance[neighbour.value] = distance[vertex] + 1;
          }
          resolve();
        }, delay ?? 1000);
      });
    }

    async function processArray(array: Array<VertexItemType>, vertex: string) {
      for (let i = 0; i < array.length; i++) {
        await processItem(array[i], vertex);
      }
    }

    async function handleVertex(vertex: KeyType) {
      // получаем список смежных вершин
      let reversedNeighboursList = [...list[vertex]].reverse();
      await processArray(reversedNeighboursList, vertex as string);
    }

    // перебираем вершины из стека, пока он не опустеет
    while (stack.length) {
      if (setStack) setStack(stack as Array<string>);
      let activeVertex = stack.pop();
      await handleVertex(activeVertex as KeyType);
    }

    return { distance, previous };
  }

  async findShortestPath(
    startVertex: KeyType,
    finishVertex: KeyType,
    badVertex: KeyType,
  ) {
    let result = await this.dfs(startVertex, badVertex);

    if (!(finishVertex in result.previous))
      throw new Error(
        `Нет пути из вершины ${startVertex} в вершину ${finishVertex}`,
      );

    let path = [];

    let currentVertex = finishVertex;

    while (currentVertex !== startVertex) {
      path.unshift(currentVertex);
      currentVertex = result.previous[currentVertex] as KeyType;
    }

    path.unshift(startVertex);

    return path;
  }

  public addVertex(vertex: KeyType) {
    if (!this.vertices[vertex]) this.vertices[vertex] = [];
  }

  //откуда -> куда
  public addEdge(vertex1: KeyType, vertex2: KeyType, weight?: number) {
    if (!(vertex1 in this.vertices) || !(vertex2 in this.vertices)) {
      throw new Error('В графе нет таких вершин');
    }

    if (
      (!this.vertices[vertex1].find((el) => el.value === vertex2) &&
        !this.isOrient) ||
      this.isOrient
    ) {
      this.vertices[vertex1].push({
        value: vertex2,
        weight: weight ?? 0,
      });
    }

    if (
      !this.vertices[vertex2].find((el) => el.value === vertex1) &&
      !this.isOrient
    ) {
      this.vertices[vertex2].push({
        value: vertex1,
        weight: weight ?? 0,
      });
    }
  }

  public deleteVertex(vertex: KeyType) {
    const deletedVertices = this.vertices[vertex];
    if (deletedVertices) {
      deletedVertices.forEach((v) => {
        const arr = this.vertices[v.value];
        const deletedIndex = arr.findIndex((el) => el.value === vertex);
        if (deletedIndex !== -1) arr.splice(deletedIndex, 1);
      });
    }
    delete this.vertices[vertex];
  }

  public deleteEdge(vertex1: KeyType, vertex2: KeyType) {
    if (!(vertex1 in this.vertices) || !(vertex2 in this.vertices)) {
      throw new Error('В графе нет таких вершин');
    }

    if (this.vertices[vertex1].find((el) => el.value === vertex2)) {
      const arr = this.vertices[vertex1];
      const deletedIndex = arr.findIndex((el) => el.value === vertex2);
      if (deletedIndex !== -1) this.vertices[vertex1].splice(deletedIndex, 1);
    }

    if (
      this.vertices[vertex2].find((el) => el.value === vertex1) &&
      !this.isOrient
    ) {
      const arr = this.vertices[vertex2];
      const deletedIndex = arr.findIndex((el) => el.value === vertex1);
      if (deletedIndex !== -1) this.vertices[vertex2].splice(deletedIndex, 1);
    }
  }

  public kruskal() {
    if (this.getIsOrient()) {
      throw new Error('Граф ориентированный!');
    }
    //Инициализировать новый граф, который будет содержать минимальное остовное дерево исходного графа.
    const minimumSpanningTree = new Graph();
    const sortingCallbacks = {
      compareCallback: (graphEdgeA: IEdge, graphEdgeB: IEdge) => {
        if (graphEdgeA.weight === graphEdgeB.weight) return 1;
        return graphEdgeA.weight <= graphEdgeB.weight ? -1 : 1;
      },
    };
    const sortedEdges = this.getAllEdges().sort(
      sortingCallbacks.compareCallback,
    );
    //Создайте непересекающиеся множества для всех вершин графа.
    const keyCallback = (graphVertex: KeyType) => graphVertex;
    const disjointSet = new DisjointSet(keyCallback);
    this.getAllVertices().forEach((graphVertex) => {
      disjointSet.makeSet(graphVertex);
    });
    // Пройдитесь по всем ребрам, начиная с минимального, и попробуйте их добавить.
    // к минимальному связующему дереву. Критерием добавления ребра будет то, будет ли
    // образует цикл или нет (если соединяет две вершины из одной непересекающейся
    // установлено или нет).
    for (let edgeIndex = 0; edgeIndex < sortedEdges.length; edgeIndex += 1) {
      const currentEdge = sortedEdges[edgeIndex];
      if (!disjointSet.inSameSet(currentEdge.from, currentEdge.to)) {
        // Объедините два подмножества в одно.
        disjointSet.union(currentEdge.from, currentEdge.to);
        minimumSpanningTree.addVertex(currentEdge.from);
        minimumSpanningTree.addVertex(currentEdge.to);
        //Добавьте это ребро к связующему дереву.
        minimumSpanningTree.addEdge(
          currentEdge.from,
          currentEdge.to,
          currentEdge.weight,
        );
      }
    }
    return minimumSpanningTree;
  }
  //"На пальцах" примерно так... Алгоритм основан на том, что, грубо говоря, там,
  // где уже побывали - больше не будем. И что чем дальше идем, тем больший суммарный вес - именно поэтому нам не
  // нужно возвращаться: ничего лучше, чем есть, уже не будет. А ребра с отрицательным весом эти правила нарушают - может
  // оказаться, что если воспользоваться ребром с отрицательным весом и вернуться в уже просмотренную вершину, то вес пути
  // к ней окажется меньше. Что противоречит идее в основе алгоритма. –
  //В графе с отрицательными весами понятие пути минимального веса может быть не определено.
  // Это не зависит от алгоритма решающего задачу. Сам граф так (может быть) устроен, что нельзя сказать про какой-то путь -
  // "это путь минимального веса". Пока это так, никакой алгоритм не может решить задачу, так как он будет искать то чего нет.
  // Определитесь что такое путь минимального веса в вашем примере, тогда можно будет говорить находит ли конкретный алгоритм именно его.
  public dijkstra(startVertex: KeyType) {
    // Вспомогательные переменные инициализации, которые нам понадобятся для алгоритма Дейкстры.
    const distances: { [key in string]: KeyType } = {};
    const visitedVertices: { [key in string]: KeyType } = {};
    const previousVertices: { [key in string]: KeyType | null } = {};
    const queue = new PriorityQueue();

    // Инициализируем все расстояния с бесконечностью, предполагая, что
    // в данный момент мы не можем достичь ни одной вершины, кроме начальной.
    this.getAllVertices().forEach((vertex) => {
      distances[vertex] = Infinity;
      previousVertices[vertex] = null;
    });

    // Мы уже находимся в начальной вершине, поэтому расстояние до нее равно нулю.
    distances[startVertex] = 0;

    // Инициализация очереди вершин
    queue.add(startVertex, distances[startVertex] as number);

    // Перебирать приоритетную очередь вершин, пока она не станет пустой.
    while (!queue.isEmpty()) {
      // Получить следующую ближайшую вершину.
      const currentVertex = queue.poll();

      // Перебрать каждого непосещенного соседа текущей вершины.
      this.vertices[currentVertex].forEach((neighbor) => {
        // Не посещайте уже посещенные вершины.
        if (!visitedVertices[neighbor.value]) {
          // Обновить расстояния до каждого соседа от текущей вершины.
          const existingDistanceToNeighbor = distances[neighbor.value];
          const distanceToNeighborFromCurrent =
            (distances[currentVertex] as number) + neighbor.weight;

          // Если мы нашли более короткий путь к соседу — обновите его.
          if (distanceToNeighborFromCurrent < existingDistanceToNeighbor) {
            distances[neighbor.value] = distanceToNeighborFromCurrent;

            // Изменить приоритет соседа в очереди, так как он мог стать ближе.
            if (queue.hasValue(neighbor.value)) {
              queue.changePriority(neighbor.value, distances[neighbor.value]);
            }

            // Запомните предыдущую ближайшую вершину.
            previousVertices[neighbor.value] = currentVertex;
          }

          // Добавьте соседа в очередь для дальнейшего посещения.
          if (!queue.hasValue(neighbor.value)) {
            queue.add(neighbor.value, distances[neighbor.value] as number);
          }
        }
      });

      // Добавьте текущую вершину к посещенным, чтобы в дальнейшем не посещать ее повторно.
      visitedVertices[currentVertex] = currentVertex;
    }

    // Возвращает набор кратчайших расстояний до всех вершин и набор
    // кратчайших путей ко всем вершинам графа.
    return {
      distances,
      previousVertices,
    };
  }

  public bellmanFord(startVertex: KeyType, limit: number) {
    const distances: { [key in string]: KeyType } = {};
    const previousVertices: { [key in string]: KeyType | null } = {};

    // Инициализируем все расстояния с бесконечностью, предполагая,
    // что в данный момент мы не можем достичь ни одной вершины, кроме начальной.
    distances[startVertex] = 0;
    this.getAllVertices().forEach((vertex) => {
      previousVertices[vertex] = null;
      if (vertex !== startVertex) {
        distances[vertex] = Infinity;
      }
    });

    // Нам понадобится (|V| - 1) итераций.
    for (
      let iteration = 0;
      iteration < this.getAllVertices().length - 1;
      iteration += 1
    ) {
      // Во время каждой итерации проходят все вершины.
      Object.keys(distances).forEach((vertex) => {
        // Пройдите через все ребра вершин.
        this.vertices[vertex].forEach((neighbor) => {
          // Выясним, меньше ли расстояние до соседа в этой
          // итерации, чем в предыдущей.
          const distanceToVertex = distances[vertex];
          const distanceToNeighbor =
            (distanceToVertex as number) + neighbor.weight;
          if (distanceToNeighbor < distances[neighbor.value]) {
            distances[neighbor.value] = distanceToNeighbor;
            previousVertices[neighbor.value] = vertex;
          }
        });
      });
    }

    const perefery: { [key in string]: KeyType | null } = {};
    Object.entries(distances).forEach(([key, dist]) => {
      if (Number(dist) > limit) {
        perefery[key] = dist;
      }
    });

    return {
      distances,
      previousVertices,
      perefery,
    };
  }

  public floydWarshall(v1: KeyType, v2: KeyType, L: number) {
    const vertices = this.getAllVertices();

    // Инициализировать матрицу предыдущих вершин с нулями, что означает отсутствие
    // существуют предыдущие вершины, которые дадут нам кратчайший путь.
    const nextVertices = Array(vertices.length)
      .fill(null)
      .map(() => {
        return Array(vertices.length).fill(null);
      });

    //Начальная матрица расстояний с бесконечностью означает,
    // что путей между вершинами пока не существует.

    const distances = Array(vertices.length)
      .fill(null)
      .map(() => {
        return Array(vertices.length).fill(Infinity);
      });

    //Инициализируем матрицу расстояний с расстоянием, которое мы уже сейчас (от существующих ребер).
    //А также инициализировать предыдущие вершины с ребер.
    vertices.forEach((startVertex, startIndex) => {
      vertices.forEach((endVertex, endIndex) => {
        if (startVertex === endVertex) {
          distances[startIndex][endIndex] = 0;
        } else {
          // Найдите ребро между начальной и конечной вершинами
          const edge = this.vertices[startVertex].find(
            (v) => v.value === endVertex,
          );

          if (edge) {
            // Существует ребро от вершины с startIndex до вершины с endIndex.
            // Сохраните расстояние и предыдущую вершину.
            distances[startIndex][endIndex] = edge.weight;
            nextVertices[startIndex][endIndex] = startVertex;
          } else {
            distances[startIndex][endIndex] = Infinity;
          }
        }
      });
    });

    // Теперь перейдем к сути алгоритма.
    // Возьмем все пары вершин (от начала до конца) и попробуем проверить, есть ли там
    // между ними существует более короткий путь через среднюю вершину. Средняя вершина также может
    // быть одной из вершин графа. Как вы можете видеть, теперь у нас будет три
    // циклически проходит по всем вершинам графа: для начальной, конечной и средней вершины.
    vertices.forEach((middleVertex, middleIndex) => {
      // Путь начинается с startVertex с помощью startIndex.
      vertices.forEach((startVertex, startIndex) => {
        // Путь заканчивается на endVertex с помощью endIndex.
        vertices.forEach((endVertex, endIndex) => {
          // Сравните существующее расстояние от startVertex до endVertex с расстоянием
          // от startVertex до endVertex, но через middleVertex.
          // Сохраняем кратчайшее расстояние и предыдущую вершину, которая позволяет
          // нам нужно это кратчайшее расстояние.
          const distViaMiddle =
            distances[startIndex][middleIndex] +
            distances[middleIndex][endIndex];

          if (distances[startIndex][endIndex] > distViaMiddle) {
            // Мы нашли кратчайший проход через среднюю вершину.
            distances[startIndex][endIndex] = distViaMiddle;
            nextVertices[startIndex][endIndex] = middleVertex;
          }
        });
      });
    });

    const indexV1 = this.getAllVertices().indexOf(String(v1));
    const indexV2 = this.getAllVertices().indexOf(String(v2));
    const dist = distances[indexV1][indexV2];
    const isExist = dist <= L;
    return { distances, nextVertices, dist, isExist };
  }

  public getVerticesMatrix() {
    let matrixVertices: Array<Array<Array<number>>> = [];
    Object.keys(this.vertices).forEach((curVertex, index) => {
      matrixVertices.push([]);
      Object.keys(this.vertices).forEach((vertex) => {
        const vStraight = this.vertices[curVertex].find(
          (v) => v.value === vertex,
        );
        const vReturn = this.vertices[vertex].find(
          (v) => v.value === curVertex,
        );
        if (curVertex === vertex) {
          matrixVertices[index].push([0, 0, 1]);
        } else if (vStraight) {
          matrixVertices[index].push([vStraight.weight, 0, 1]);
        } else if (vReturn) {
          matrixVertices[index].push([vReturn.weight, 0, -1]);
        } else {
          matrixVertices[index].push([0, 0, 1]);
        }
      });
    });
    return matrixVertices;
  }

  public getMaxVertex(
    currentVertex: number,
    matrixVertices: Array<Array<Array<number>>>,
    visited: Array<number>,
  ) {
    let max = 0; // наименьшее допустимое значение
    let vertexResult = -1;
    matrixVertices[currentVertex].forEach((vertex, index) => {
      if (!visited.includes(index)) {
        if (vertex[2] === 1) {
          if (max < vertex[0]) {
            max = vertex[0];
            vertexResult = index;
          }
        } else {
          if (max < vertex[1]) {
            max = vertex[1];
            vertexResult = index;
          }
        }
      }
    });
    return vertexResult;
  }

  public updateMatrix(
    matrixVertices: Array<Array<Array<number>>>,
    routes: Array<Array<number>>,
    stream: number,
  ) {
    const newMatrixVertices = matrixVertices;
    routes.forEach((el) => {
      if (el[1] !== -1) {
        const sgn = newMatrixVertices[el[2]][el[1]][2];
        newMatrixVertices[el[1]][el[2]][0] -= stream * sgn;
        newMatrixVertices[el[1]][el[2]][1] += stream * sgn;
        newMatrixVertices[el[2]][el[1]][0] -= stream * sgn;
        newMatrixVertices[el[2]][el[1]][1] += stream * sgn;
      }
    });
    return newMatrixVertices;
  }

  public getMaxFlow(routes: Array<Array<number>>) {
    return routes.map((el) => el[0]).reduce((x, y) => Math.min(x, y));
  }
  public maxStream(init: number, end: number) {
    let matrixVertices = this.getVerticesMatrix();
    const routeInit = [Infinity, -1, init]; // первая метка маршрута (a, from, vertex)
    const routeStreams: Array<number> = []; // максимальные потоки найденных маршрутов
    let j = init;
    while (j !== -1) {
      let startVertex = init; // стартовая вершина (нумерация с нуля)
      const routes = [routeInit]; // метки маршрута
      const visited = [init]; // множество просмотренных вершин
      // eslint-disable-next-line eqeqeq
      while (startVertex != end) {
        j = this.getMaxVertex(startVertex, matrixVertices, visited); // выбираем вершину с наибольшей пропускной способностью
        // если следующих вершин нет
        if (j === -1) {
          // eslint-disable-next-line eqeqeq
          if (startVertex == init) {
            //и мы на истоке, то завершаем поиск маршрутов
            break;
          } else {
            // @ts-ignore
            startVertex = routes.pop()[2];
          }
        } else {
          let currentStream = // определяем текущий поток
            // eslint-disable-next-line eqeqeq
            matrixVertices[startVertex][j][2] == 1
              ? matrixVertices[startVertex][j][0]
              : matrixVertices[startVertex][j][1];

          routes.push([currentStream, j, startVertex]); // добавляем метку маршрута
          visited.push(j); // запоминаем вершину как просмотренную
          // если дошди до стока
          if (j === end) {
            routeStreams.push(this.getMaxFlow(routes)); // находим максимальную пропускную способность маршрута
            matrixVertices = this.updateMatrix(
              matrixVertices,
              routes,
              routeStreams[routeStreams.length - 1],
            ); // обновляем веса дуг
            break;
          }
          startVertex = j;
        }
      }
    }
    return routeStreams.reduce((el, accum) => accum + el);
  }
}
