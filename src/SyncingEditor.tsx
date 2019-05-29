import React, { useState, useRef, useEffect } from "react";
import { Editor } from "slate-react";
import Mitt from "mitt";
import { initialValue } from "./slateInitialValue";
import { Operation } from "slate";

interface Props {}

const emitter = new Mitt();

export const SyncingEditor: React.FC<Props> = () => {
  const [value, setValue] = useState(initialValue);
  const editor = useRef<Editor | null>(null);
  const id = useRef(`${Date.now()}`);
  const remote = useRef(false);

  useEffect(() => {
    (emitter as any).on("*", (type: string, ops: Operation[]) => {
      if (id.current !== type) {
        remote.current = true;
        ops.forEach(op => editor.current!.applyOperation(op));
        remote.current = false;
        console.log("changed happened in other editor");
      }
    });
  }, []);

  return (
    <Editor
      ref={editor}
      value={value}
      onChange={options => {
        setValue(options.value);

        const ops = options.operations
          .filter(o => {
            if (o) {
              return (
                o.type !== "set_selection" &&
                o.type !== "set_value" &&
                (!o.data || !o.data.has("source"))
              );
            }
            return false;
          })
          .toJS()
          .map((o: any) => ({ ...o, data: { source: "one" } }));

        if (ops.length && !remote.current) {
          emitter.emit(id.current, ops);
        }
      }}
    />
  );
};
