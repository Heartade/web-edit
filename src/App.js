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
// PIXI SETUP
//	this.pixi_cnt = null;
//	this.app = new PIXI.Application({width: {this.state.width}, height: {this.state.height}, transparent: false});
// STATES
    this.state = {
      width: 0,
      height: 0,
      imageDataURL: "",
      file: "",
      saveurl: "",
      texture: PIXI.Texture.EMPTY
    };
// UNIFORMS AND SHADERS
	this.uniforms = {
		conv3x3 : {
		u_textureSize: {
			type: "2f",
			value: [0,0]
		},
		u_kernel: {
			type: "1fv",
			value: [0.1,0.1,0.1,0.1,0,0.1,0.1,0.1,0.1]
		},
		u_kernelWeight: {
			type: "1f",
			value: 0.8
		}
		}
	}
	this.vShader = {
		conv3x3: "precision mediump float;\
attribute vec2 aVertexPosition;							\
attribute vec2 aTextureCoord;							\
attribute vec4 aColor;									\
uniform mat3 projectionMatrix;							\
uniform vec2 u_textureSize;								\
varying vec2 textureCoord;								\
void main() {											\
	vec2 zeroToOne = aVertexPosition/u_textureSize;		\
	vec2 zeroToTwo = zeroToOne*2.0;						\
	vec2 clipSpace = zeroToTwo-1.0;						\
	gl_Position = vec4((projectionMatrix*vec3(aVertexPosition, 1.0)).xy, 0,1);		\
	textureCoord = aTextureCoord;						\
}"
	}
	this.fShader = {
		conv3x3: "									\
precision mediump float;								\
uniform sampler2D texture;								\
uniform vec2 u_textureSize;								\
uniform float u_kernel[9];								\
uniform float u_kernelWeight;							\
varying vec2 textureCoord;								\
void main() {											\
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;		\
	vec4 colorSum =										\
		texture2D(texture, textureCoord + onePixel * vec2(-1,-1))*u_kernel[0] +	\
		texture2D(texture, textureCoord + onePixel * vec2( 0,-1))*u_kernel[1] +	\
		texture2D(texture, textureCoord + onePixel * vec2( 1,-1))*u_kernel[2] +	\
		texture2D(texture, textureCoord + onePixel * vec2(-1, 0))*u_kernel[3] +	\
		texture2D(texture, textureCoord + onePixel * vec2( 0, 0))*u_kernel[4] +	\
		texture2D(texture, textureCoord + onePixel * vec2( 1, 0))*u_kernel[5] +	\
		texture2D(texture, textureCoord + onePixel * vec2(-1, 1))*u_kernel[6] +	\
		texture2D(texture, textureCoord + onePixel * vec2( 0, 1))*u_kernel[7] +	\
		texture2D(texture, textureCoord + onePixel * vec2( 1, 1))*u_kernel[8] ;	\
	gl_FragColor = vec4((colorSum/u_kernelWeight).rgb, 1.0);					\
}"
	}
// METHODS
  this.updateImage = this.updateImage.bind(this); //update image
	this.appendShader = this.appendShader.bind(this); //add a new shader to processing stack
	this.setShader = this.setShader.bind(this);
// INITIAL SHADER
    this.state.shader = [];
  }
//  updatePixiCnt = (element)=>{
    // THE ELEMENT IS THE DOM OBJECT WE USE AS CONTAINER FOR PIXI CANVAS
//    this.pixi_cnt = element;
    // ADDING APPLICATION TO DOM ELEMENT
//    if(this.pixi_cnt && this.pixi_cnt.children.length<=0) {
//      this.pixi_cnt.appendChild(this.state.app.view);
//      this.setup();
//    }
//  };
//  setup = ()=>{
//    PIXI.loader.add("avatar",myImage).load(this.initialize);
//  };
//  initialize = ()=>{
//    this.avatar = new PIXI.Sprite(PIXI.loader.resources["avatar"].texture);
//    this.state.app.stage.addChild(this.avatar);
//  };
  render() {
    return (
      <div className="App" style={{display: "flex", flexDirection: "column", align: "center"}}>
        <label>
          <FileInput
            readAs='dataUrl'
            style={{display:'none'}}
            onLoad={this.updateImage}
          />
          <span>
            CLICK HERE TO LOAD IMAGE
          </span>
        </label>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          <button onClick={()=>{
            this.uniforms.conv3x3.u_kernel.value = [0.1,0.1,0.1,0.1,0,0.1,0.1,0.1,0.1];
            this.uniforms.conv3x3.u_kernelWeight.value = 0.8;
            this.appendShader(this.vShader.conv3x3,this.fShader.conv3x3,this.uniforms.conv3x3)
          }}>
            BLUR
          </button>
          <button onClick={()=>{
            this.uniforms.conv3x3.u_kernel.value = [-1,-1,-1,-1,8,-1,-1,-1,-1];
            this.uniforms.conv3x3.u_kernelWeight.value = 1;
            this.appendShader(this.vShader.conv3x3,this.fShader.conv3x3,this.uniforms.conv3x3)
          }}>
            EDGE
          </button>
          <button onClick={()=>this.setState({shader: []})}>
            RESET
          </button>
          <button onClick={()=>{
            var canvas = document.getElementById("processCanvas");
            var dataURI = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
            var blob = this.dataURItoBlob(dataURI);
            console.log(dataURI);
            this.setState({saveurl: window.URL.createObjectURL(blob)});
          }}>
            RENDER
          </button>
          <a id="saveButton" download="save.jpg" target="_blank" href={this.state.saveurl}>SAVE</a>
        </div>
        <p>PROCESSED IMAGE</p>
        <Stage id="processCanvas" width={this.state.width} height={this.state.height} options={{preserveDrawingBuffer: true, backgroundColor: 0xFFFFFF}}>
          <Sprite texture={this.state.texture} filters={this.state.shader}/>
        </Stage>
        <p>ORIGINAL IMAGE</p>
        <img id="img" alt="" src={this.state.imageDataURL}>
        </img>
      </div>
    );
  }
  //setShader: set a shader
  setShader(vShaderCode,fShaderCode,uniforms) {
    var newShader = new PIXI.AbstractFilter(vShaderCode,fShaderCode,uniforms);
    this.setState({
      shader: [newShader]
    });
  }
  //appendShader: append a shader to filter list
  appendShader(vShaderCode,fShaderCode,uniforms) {
    var newShader = new PIXI.AbstractFilter(vShaderCode,fShaderCode,uniforms);
    var shaders = this.state.shader;
    this.setState({
      shader: shaders.concat([newShader])
    });
    console.log(this.state.shader);
  }
  //updateImage: update state from FileInput stream
  updateImage(event,file) {
    var res = event.target.result;
    this.setState({imageDataURL:res, file:file});
	  var img = new Image();
    img.onload = ()=>{
      console.log(img.width);
      this.setState({width: img.width, height: img.height, texture: PIXI.Texture.fromImage(res)});
      this.uniforms.conv3x3.u_textureSize.value = [img.width,img.height];
    }
	  img.src = res;
    
  }
  dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }
}


export default App;
