import { BaseNode, BaseTrace, BaseUtils } from '@voiceflow/base-types';

import log from '@/logger';
import Client, { EventType } from '@/runtime';

import { FrameType, Output, TurnType } from './types';
import { addOutputTrace, getOutputTrace } from './utils';

// initialize event behaviors for client
const init = (client: Client) => {
  client.setEvent(EventType.stackDidChange, ({ runtime }) => {
    const top = runtime.stack.top();

    if (!top || top.getProgramID() === runtime.getVersionID()) {
      return;
    }
    runtime.trace.addTrace<BaseNode.Flow.TraceFrame>({
      type: BaseNode.Utils.TraceType.FLOW,
      payload: { diagramID: top.getProgramID(), name: top.getName() },
    });
  });

  client.setEvent(EventType.frameDidFinish, async ({ runtime }) => {
    if (!runtime.stack.top()?.storage.get(FrameType.CALLED_COMMAND)) {
      return;
    }

    runtime.stack.top().storage.delete(FrameType.CALLED_COMMAND);

    const output = runtime.stack.top().storage.get<Output>(FrameType.OUTPUT);

    if (!output) {
      return;
    }

    addOutputTrace(
      runtime,
      getOutputTrace({
        output,
        version: runtime.version,
        variables: runtime.variables,
      }),
      { variables: runtime.variables }
    );
  });

  client.setEvent(EventType.handlerWillHandle, ({ runtime, node }) => {
    // runtime only nodes don't have associated node on the FE
    if (BaseUtils.nodeType.isRuntimeOnly(node.type)) return;
    runtime.trace.addTrace<BaseTrace.BlockTrace>({
      type: BaseNode.Utils.TraceType.BLOCK,
      payload: { blockID: node.id },
    });
  });

  client.setEvent(EventType.updateDidExecute, ({ runtime }) => {
    if (runtime.stack.isEmpty() && !runtime.turn.get(TurnType.END)) {
      runtime.trace.addTrace<BaseNode.Exit.TraceFrame>({ type: BaseNode.Utils.TraceType.END, payload: undefined });
    }
  });

  client.setEvent(EventType.handlerDidCatch, ({ error }) => log.debug(error));

  client.setEvent(EventType.timeout, ({ runtime }) => {
    runtime.trace.debug('ERROR: turn timeout - check for infinite loops');
  });
};

export default init;
