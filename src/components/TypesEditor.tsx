import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { StandardEditorProps } from '@grafana/data';

import {Field,Input, RadioButtonGroup, Button, IconButton} from "@grafana/ui"

// import { Button } from 'antd';

const initialCode = `
/* You can access the row values via Record */
console.log(Record)
/* You can access to dashboard variables via Variables */
console.log(Variables)
/* You can use pre defined axios library */
Axios.get("https://jsonplaceholder.typicode.com/todos/1")
    .then(data => console.log(data.data))
/* You can use pre defined moment library */
console.log(Moment.unix(1694201497).format("DD/MM/YYYY"))   

/* You can set dashboard variables as example...
LocationService.partial({ 'var-service': 'billing' }, true);
*/
` 

type ButtonField = {
  buttonName: string;
  columnName: string;
  type: string;
  width: string;
  position: string;
  code: string;
} 

export const TypesEditor = (props: StandardEditorProps<Array<ButtonField>>) => {
  const initialButtonField: ButtonField = {
    buttonName: "",
    columnName: "",
    type: "default",
    width: "100",
    position: "right",
    code: initialCode
  }

  const { onChange, value} = props


  const [buttons, setButtons] = useState<Array<ButtonField>>(value || [ initialButtonField])


  const handleFieldChange = (value: string, index: number, name:  keyof ButtonField ) => {
    setButtons(prevState => {
      const dumState = [...prevState]
      dumState[index][name] = value

      return dumState
    })
  }

  const removeButton = (index: number) => {
    setButtons(prevState => {
      const dumState = [...prevState].filter((item, idx) => idx != index)
      return dumState
    })
  }
  

  const renderFileds = () => {
    return buttons.map((item, index) => (
      <div>
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={() => removeButton(index)} aria-label='' name="trash-alt" />
        </div>
        <Field label="Column Name" >
          <Input value={buttons[index].columnName} onChange={e => handleFieldChange(e.currentTarget.value, index, "columnName")} />
        </Field>
        <Field label="Button Name" >
          <Input value={buttons[index].buttonName} onChange={e => handleFieldChange(e.currentTarget.value, index, "buttonName")} />
        </Field>
        <Field label="Type of Button">
          <RadioButtonGroup
            value={buttons[index].type}
            onChange={value => handleFieldChange(value, index, "type")}
            options={[
              { label: 'default', value: 'default' },
              { label: 'primary', value: 'primary' },
              { label: 'green', value: 'green' },
              { label: 'danger', value: 'danger' },
            ]} 
          />
        </Field>
        <Field label="Button Width" >
          <Input type="number" value={buttons[index].width} onChange={e => handleFieldChange(e.currentTarget.value, index, "width")} />
        </Field>
        <Field label="Position of Button">
          <RadioButtonGroup
            value={buttons[index].position}
            onChange={value => handleFieldChange(value, index, "position")}
            options={[
              { label: 'left', value: 'left' },
              { label: 'right', value: 'right' },
            ]} 
          />
        </Field>
        <Field label="Define function">
          <div style={{height: 200}}>
            <Editor
              language="javascript"
              value={buttons[index].code}
              theme="vs-dark"
              onChange={(value) => handleFieldChange(value || "", index, "code")}
            />
          </div>
        </Field>
        <div style={{marginBottom: 15 ,borderTop: "1px solid rgba(204, 204, 220, 0.12)"}} />
      </div>
      ))
  }

  useEffect(() => {
    if(onChange) {
      onChange(buttons)
    }
  }, [buttons])

  return (
    <div>
    {renderFileds()}
    <Button onClick={() => setButtons(prevState => ([...prevState, initialButtonField]))}>Add Button</Button>      
    </div>
  );
};
