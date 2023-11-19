import { useEffect, useState } from 'react';
import GraphClass from 'graphs/graph';
import {
  Graph as GraphD3,
  GraphConfiguration,
  GraphData,
} from 'react-d3-graph';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

const myConfig: Partial<
  GraphConfiguration<
    | { id: string; color: string; size: number }
    | { id: string; color?: undefined; size?: undefined },
    { source: string; target: string }
  >
> = {
  nodeHighlightBehavior: true,
  width: 1500,
  height: 600,
  node: {
    color: '#12b76a',
    size: 300,
    labelProperty: 'id',
    highlightStrokeColor: 'blue',
    fontSize: 19,
  },
  link: {
    type: 'CURVE_SMOOTH',
    highlightColor: 'lightblue',
  },
};

export default function Graph() {
  const [delay, setDelay] = useState('1000');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [graph, setGraph] = useState(() => {
    const newGraph = new GraphClass(false);
    const vertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'U'];
    const edges = [
      ['A', 'B'],
      ['A', 'C'],
      ['C', 'D'],
      ['C', 'E'],
      ['A', 'F'],
      ['F', 'G'],
      ['B', 'C'],
      ['B', 'U'],
      ['U', 'E'],
      ['F', 'C'],
    ];
    vertices.forEach((v) => newGraph.addVertex(v));
    edges.forEach((e) => newGraph.addEdge(e[0], e[1]));
    return newGraph;
  });
  const [d3Data, setD3Data] = useState<GraphData<any, any> | null>(null);
  const [stack, setStack] = useState<Array<string>>([]);
  const [queue, setQueue] = useState<Array<string>>([]);
  const [isProceed, setIsProceed] = useState(false);
  const [isShowAlert, setIsShowAlert] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [visited, setVisited] = useState<Array<string>>([]);
  useEffect(() => {
    setD3Data(graph.getD3Data());
  }, [graph]);

  useEffect(() => {
    if (
      d3Data?.nodes.length === visited.length + 2 &&
      queue.length <= 1 &&
      stack.length <= 1
    ) {
      setIsProceed(false);
      setIsShowAlert(true);
    }
  }, [d3Data?.nodes.length, queue.length, stack.length, visited.length]);

  function dfsChange(vertex: string, parentVertex: string) {
    console.log(vertex, parentVertex);
    setD3Data((prev) => {
      if (prev) {
        return {
          links: prev.links.map((link) => ({
            ...link,
            strokeWidth:
              (link.source === parentVertex && link.target === vertex) ||
              (link.source === vertex && link.target === parentVertex)
                ? 4
                : link.strokeWidth,
            color:
              (link.source === parentVertex && link.target === vertex) ||
              (link.source === vertex && link.target === parentVertex)
                ? '#f17025'
                : link.color,
          })),
          nodes: prev.nodes.map((n) => ({
            ...n,
            color: vertex === n.id ? '#c33' : n.color,
          })),
        };
      }
      return null;
    });
  }
  function changeStack(newStack: Array<string>) {
    setStack(newStack);
  }

  function changeQueue(newQueue: Array<string>) {
    setQueue((prev) => [...newQueue]);
  }

  function changeVisited(v: string) {
    setVisited((prev) => [...prev, v]);
  }

  const startDfs = () => {
    setIsProceed(true);
    graph.dfs('A', '_', Number(delay), dfsChange, changeStack, changeVisited);
  };

  const startBfs = () => {
    setIsProceed(true);
    graph.bfs('A', '_', Number(delay), dfsChange, changeQueue, changeVisited);
  };

  const revert = () => {
    setIsShowAlert(false);
    setD3Data(graph.getD3Data());
    setVisited([]);
    setStack([]);
    setQueue([]);
  };

  return (
    <div>
      {isShowAlert && (
        <Alert
          severity="success"
          sx={{ position: 'absolute', zIndex: 1000, right: 20, bottom: 20 }}
        >
          <AlertTitle>Обход совершен!</AlertTitle>
          Количество посещенных вершин — <strong>{visited.length}</strong>
          <div>
            Для того чтобы продолжить нажмите <strong>"СБРОС"</strong>
          </div>
        </Alert>
      )}
      {!isStarting && (
        <Button
          sx={{ fontSize: 20 }}
          onClick={() => {
            setIsStarting(true);
            revert();
          }}
        >
          Начать!
        </Button>
      )}

      {d3Data && (
        <GraphD3
          id="graph-id" // id is mandatory, if no id is defined rd3g will throw an error
          data={d3Data as any}
          config={myConfig}
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          disabled={isProceed || visited.length !== 0}
          variant={'contained'}
          onClick={startDfs}
        >
          DFS
        </Button>
        <Button
          disabled={isProceed || visited.length !== 0}
          variant={'contained'}
          onClick={startBfs}
        >
          BFS
        </Button>
        <Button disabled={isProceed} variant={'outlined'} onClick={revert}>
          Cброс
        </Button>
        <TextField
          disabled={isProceed}
          variant="outlined"
          value={delay}
          onChange={(e) => setDelay(e.target.value)}
          label={'Введите задержку (в мс)'}
        ></TextField>
      </Box>

      <Card sx={{ position: 'absolute', left: 10, top: 30 }}>
        <CardContent>
          <Typography variant="h5" component="div">
            Стек
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            Вершины, которые в данной итерации находятся в стеке
          </Typography>
          <List component="nav">
            {stack.map((el) => (
              <>
                <ListItem>
                  <ListItemText
                    sx={{ display: 'flex', justifyContent: 'center' }}
                    primary={el}
                  />
                </ListItem>
                <Divider />
              </>
            ))}
          </List>
        </CardContent>
      </Card>
      <Card sx={{ position: 'absolute', right: 10, top: 30 }}>
        <CardContent>
          <Typography variant="h5" component="div">
            Очередь
          </Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">
            Вершины, которые в данной итерации находятся в очереди
          </Typography>
          <List component="nav">
            {queue.map((el) => (
              <>
                <ListItem>
                  <ListItemText
                    sx={{ display: 'flex', justifyContent: 'center' }}
                    primary={el}
                  />
                </ListItem>
                <Divider />
              </>
            ))}
          </List>
        </CardContent>
      </Card>
      <Card sx={{ position: 'absolute', left: 10, top: 500 }}>
        <CardContent>
          <Typography variant="h5" component="div">
            Посещённые вершины
          </Typography>
          <List component="nav">
            {visited.map((el) => (
              <>
                <ListItem>
                  <ListItemText
                    sx={{ display: 'flex', justifyContent: 'center' }}
                    primary={el}
                  />
                </ListItem>
                <Divider />
              </>
            ))}
          </List>
        </CardContent>
      </Card>
    </div>
  );
}
