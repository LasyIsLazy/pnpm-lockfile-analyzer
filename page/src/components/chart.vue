<script setup lang="ts">
import cytoscape from 'cytoscape';
import klay from 'cytoscape-klay';
import { computed, onMounted } from 'vue';

const { data = { workspace: [], dependencies: [] } } = defineProps<{
  data: {
    workspace: {
      id: string;
      name: string;
      children: string[];
    }[];
    dependencies: {
      id: string;
      name: string;
      version: string;
      children: string[];
    }[];
  };
}>();

const elements = computed(() => {
  const nodes: { data: { id: string; type?: string } }[] = [];
  const edges: { data: { id: string; source: string; target: string } }[] = [];
  const { workspace, dependencies } = data;
  const depMap = new Map(dependencies.map(item => [item.id, item]));
  const deps = new Set();
  workspace.forEach(item => {
  // [workspace[0]].forEach(item => {
    console.log(item)
    // root handler
    const { id, children } = item;
    nodes.push({
      data: {
        id,
        type: 'workspace',
      },
    });
    edges.push(
      ...children.map(subId => {
        return {
          data: {
            id: `${id}->${subId}`,
            source: id,
            target: subId,
          },
        };
      })
    );
    // dep handler
    let depth = 0;
    (function buildDepNodes(depIds) {
      depth++;
      if (!depIds?.length) {
        return;
      }
      depIds.forEach(depId => {
        if (!deps.has(depId)) {
          nodes.push({
            data: {
              id: depId,
              type: 'dep',
            },
          });
          deps.add(depId);
        } else {
          return
        }

        const dep = depMap.get(depId)!;

        dep.children?.forEach(subDepId => {
          edges.push({
            data: {
              id: `${depId}->${subDepId}`,
              source: depId,
              target: subDepId,
            },
          });
        });
        buildDepNodes(dep.children);
        depth--;
      });
    })(children);
  });
  console.log(nodes);
  console.log(edges);
  return {
    nodes,
    edges: edges,
  };
});

cytoscape.use(klay);

onMounted(() => {
  var cy = cytoscape({
    container: document.getElementById('cy'), // 容器元素

    elements: elements.value,
    // elements: {
    //   // 图的元素
    //   nodes: [
    //     { data: { id: 'a' } },
    //     { data: { id: 'b' } },
    //     { data: { id: 'c' } },
    //     { data: { id: 'd' } },
    //   ],
    //   edges: [
    //     { data: { id: 'ab', source: 'a', target: 'b' } },
    //     { data: { id: 'bc', source: 'b', target: 'c' } },
    //     { data: { id: 'cd', source: 'c', target: 'd' } },
    //     { data: { id: 'da', source: 'd', target: 'a' } },
    //   ],
    // },

    style: [
      // 样式
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          label: 'data(id)',
        },
      },
      {
        selector: 'node[type="workspace"]',
        style: {
          'background-color': '#ff0000',
          label: 'data(id)',
        },
      },
      {
        selector: 'edge',
        style: {
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          // triangle
          // triangle-tee
          // circle-triangle
          // triangle-cross
          // triangle-backcurve
          // vee
          // tee
          // square
          // circle
          // diamond
          // chevron
          // none
          'target-arrow-shape': 'triangle',
          // 'target-arrow-filled': 'hollow',
          // 'target-arrow-width': 4,
          'curve-style': 'bezier',
        },
      },
    ],

    // layout: {
    //   // 应用 Klay 布局
    //   name: 'klay',
    //   nodeDimensionsIncludeLabels: true,
    //   spacingFactor: 1.5,
    //   direction: 'TB', // 从上到下
    // },
  });


  var options = {
    name: 'klay',
    nodeDimensionsIncludeLabels: true, // Boolean which changes whether label dimensions are included when calculating node dimensions
    fit: true, // Whether to fit
    padding: 20, // Padding on fit
    animate: false, // Whether to transition the node positions
    animateFilter: function (node, i) {
      return true;
    }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
    animationDuration: 500, // Duration of animation in ms if enabled
    animationEasing: undefined, // Easing of animation if enabled
    transform: function (node, pos) {
      return pos;
    }, // A function that applies a transform to the final node position
    ready: function () {}, // Callback on layoutready
    stop: function () {}, // Callback on layoutstop
    klay: {
      // Following descriptions taken from  http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
      addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
      aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
      borderSpacing: 20, // Minimal amount of space to be left to the border
      compactComponents: false, // Tries to further compact components (disconnected sub-graphs).
      crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
      cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
      direction: 'UNDEFINED', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
      edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
      edgeSpacingFactor: 0.5, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
      feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
      fixedAlignment: 'NONE', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
      inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
      layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
      linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
      mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
      mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
      nodeLayering: 'NETWORK_SIMPLEX', // Strategy for node layering.
      nodePlacement: 'BRANDES_KOEPF', // Strategy for Node Placement
      randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
      routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
      separateConnectedComponents: true, // Whether each connected component should be processed separately
      spacing: 20, // Overall setting for the minimal amount of space to be left between objects
      thoroughness: 7, // How much effort should be spent to produce a nice layout.
    },
    priority: function (edge) {
      return null;
    }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
  };

  cy.layout(options).run();
});
</script>

<template>
  <div>
    <div id="cy"></div>
  </div>
</template>

<style scoped>
#cy {
  width: 100vw;
  height: 100vh;
}
</style>
