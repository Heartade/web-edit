import React, { Component } from 'react';
import FileInput from 'react-simple-file-input';
import logo from './logo.svg';
import * as PIXI from 'pixi.js';
import './App.css';
import ReactPIXI from "react-pixi-fiber/react-pixi-alias";
import { Sprite, Stage } from "react-pixi-fiber";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: "",
      uniforms: {}
    };
    this.uniforms = {
      x: {
        type: "f",
        value: 1
      },
      y: {
        type: "f",
        value: 1
      },
      z: {
        type: "f",
        value: 1
      },
    };
    this.shaderCode = "\
      precision mediump float;\
      uniform float x, y, z;\
      void main(){\
        gl_FragColor=vec4(x,y,z,1.0);\
      }\
    ";
    this.updateImage = this.updateImage.bind(this);
    this.state.simpleShader = new PIXI.AbstractFilter('',this.shaderCode,this.uniforms);
  }
  render() {
    return (
      <div className="App">
        <Stage width={800} height={600} options={{backgroundColor: 0xFFFFFF}}>
          <Sprite texture={PIXI.Texture.fromImage(this.state.file)} filters={[this.state.simpleShader]}/>
        </Stage>
        <img id="img" alt="" src={this.state.file}>
        </img>
        <label>
          <FileInput
            readAs='dataUrl'
            style={{display:'none'}}
            onLoad={this.updateImage}
          />
          <span>
            click
          </span>
        </label>
        <button onClick={()=>{this.uniforms.x=0.5;this.setState({simpleShader: new PIXI.AbstractFilter('',this.shaderCode,this.uniforms)});}}> AAA</button>
      </div>
    );
  }
  updateImage(event,file) {
    this.setState({file:event.target.result});
  }
}


export default App;
