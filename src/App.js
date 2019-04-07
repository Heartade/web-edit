import React, { Component } from 'react';
import FileInput from 'react-simple-file-input';
import * as PIXI from 'pixi.js';
import './App.css';
import { Sprite, Stage } from "react-pixi-fiber";
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      imageDataURL: "",
      file: "",
      saveurl: "",
      texture: PIXI.Texture.EMPTY,
      shader: []
    };
    this.processStack = [];
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
    },
    matrix : {
      u_textureSize: {
        type: "2f",
        value: [0,0]
      },
      u_matrix: {
        type: "1fv",
        value: [0.1,0.1,0.1,0.1,0,0.1,0.1,0.1,0.1]
      },
      u_mplus: {
        type: "1fv",
        value: [0,0,0]
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
		conv3x3: "		          							\
precision mediump float;		  						\
uniform sampler2D texture;								\
uniform vec2 u_textureSize;								\
uniform float u_kernel[9];								\
uniform float u_kernelWeight;							\
varying vec2 textureCoord;								\
void main() {									        		\
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;		\
	vec4 colorSum =										                \
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
}",
    matrix: "\
precision mediump float;						  		\
uniform sampler2D texture;								\
uniform vec2 u_textureSize;								\
uniform float u_matrix[9];								\
uniform float u_mplus[3];                 \
uniform float u_kernelWeight;							\
varying vec2 textureCoord;								\
void main() {								        			\
	vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;		\
	vec4 color = texture2D(texture, textureCoord);    \
  gl_FragColor = vec4(                              \
    color.r*u_matrix[0]+color.g*u_matrix[3]+color.b*u_matrix[6]+u_mplus[0], \
    color.r*u_matrix[1]+color.g*u_matrix[4]+color.b*u_matrix[7]+u_mplus[1], \
    color.r*u_matrix[2]+color.g*u_matrix[5]+color.b*u_matrix[8]+u_mplus[2], 1.0);       \
}",
	}
// METHODS
  this.updateImage = this.updateImage.bind(this); //update image
	this.appendShader = this.appendShader.bind(this); //add a new shader to processing stack
	this.setShader = this.setShader.bind(this);
// INITIAL SHADER
    this.state.shader = [];
  }
  render() {
    console.log(this.state.shader);
    return (
      <div className="App">
        <div className = "toolbar">
          <FileInput
            id="fileInput"
            readAs='dataUrl'
            style={{display:'none'}}
            onLoad={this.updateImage}
          />
          <div className="toolbar-title">
            <span style={{paddingLeft: "20px", paddingRight: "20px", fontSize: "1rem"}}>web-edit</span>
          </div>
          <div className="toolbar-left">
            <button onClick={()=>{document.getElementById("fileInput").click();}}>LOAD</button>
            <button onClick={()=>{
              var canvas = document.getElementById("processCanvas");
              var dataURI = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
              var blob = this.dataURItoBlob(dataURI);
              console.log(dataURI);
              this.setState({saveurl: window.URL.createObjectURL(blob)},()=>{document.getElementById('saveButton').click();});
            }}>
              SAVE
            </button>
          </div>
          <div className="toolbar-right">
            <button onClick={()=>{
              var shader = this.state.shader;
              if(shader !== undefined && shader.length > 0) {
                this.processStack.push(shader);
                this.setState({shader: shader.slice(0,-1)});
              }
            }}>
              UNDO
            </button>
            <button onClick={()=>{
              if(this.processStack.length > 0) {
                this.setState({shader: this.processStack[this.processStack.length -1]});
                this.processStack = this.processStack.slice(0,-1);
              }
            }}>
              REDO
            </button>
            <button onClick={()=>this.setState({shader: []})}>
              RESET
            </button>
            <a style={{display: 'none'}} id="saveButton" download="save.jpg" target="_blank" href={this.state.saveurl}>SAVE</a>
          </div>
        </div>
        <div className="editbar">
          <div className="editbar-left">
            <div className="dropdown">
              CONVOLUTE 3X3
              <div className="dropdown-content">
                <table>
                  <tbody>
                    <tr>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_0" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_1" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_2" defaultValue="0" rows="1" cols="1"/></th>
                    </tr>
                    <tr>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_3" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_4" defaultValue="1" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_5" defaultValue="0" rows="1" cols="1"/></th>
                    </tr>
                    <tr>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_6" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_7" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput conv3x3" id="i_conv3x3_8" defaultValue="0" rows="1" cols="1"/></th>
                    </tr>
                  </tbody>
                </table>
                <button onClick={()=>{
                  var kern = []
                  console.log(document.getElementsByClassName("conv3x3"));
                  for(var i=0;i<9;i++) {
                    kern = kern.concat([parseFloat(document.getElementsByClassName("conv3x3")[i].value)]);
                  }
                  console.log(kern);
                  this.uniforms.conv3x3.u_kernel.value = kern;
                  this.uniforms.conv3x3.u_kernelWeight.value = kern.reduce((prev,curr)=>{return prev+curr});
                  console.log(kern.reduce((prev,curr)=>{return prev+curr}));
                  this.appendShader(this.vShader.conv3x3,this.fShader.conv3x3,this.uniforms.conv3x3)
                }}>
                  APPLY
                </button>
              </div>
            </div>
            <div className="dropdown">
              CONVOLUTE 5X5
              <div className="dropdown-content">
                //TODO
              </div>
            </div>
            <div className="dropdown">
              COLOR MATRIX
              <div className="dropdown-content">
                <table>
                  <tbody>
                    <tr>
                      <th className="red">R</th>
                      <th className="green">G</th>
                      <th className="blue">B</th>
                    </tr>
                    <tr>
                      <th/><th>×</th><th/>
                    </tr>
                    <tr>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_0" defaultValue="1" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_1" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_2" defaultValue="0" rows="1" cols="1"/></th>
                    </tr>
                    <tr>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_3" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_4" defaultValue="1" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_5" defaultValue="0" rows="1" cols="1"/></th>
                    </tr>
                    <tr>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_6" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_7" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmatrix" id="i_conv3x3_8" defaultValue="1" rows="1" cols="1"/></th>
                    </tr>
                    <tr>
                      <th/><th>+</th><th/>
                    </tr>
                    <tr>
                      <th><input type="text" className = "singleinput cmplus" id="i_conv3x3_6" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmplus" id="i_conv3x3_7" defaultValue="0" rows="1" cols="1"/></th>
                      <th><input type="text" className = "singleinput cmplus" id="i_conv3x3_8" defaultValue="0" rows="1" cols="1"/></th>
                    </tr>
                    <tr>
                      <th/><th>=</th><th/>
                    </tr>
                    <tr>
                      <th className="red">R&rsquo;</th>
                      <th className="green">G&rsquo;</th>
                      <th className="blue">B&rsquo;</th>
                    </tr>
                  </tbody>
                </table>
                <button onClick={()=>{
                  var kern = []
                  var kern2 = []
                  console.log(document.getElementsByClassName("cmatrix"));
                  for(var i=0;i<9;i++) {
                    kern = kern.concat([parseFloat(document.getElementsByClassName("cmatrix")[i].value)]);
                  }
                  for(i=0;i<3;i++) {
                    kern2 = kern2.concat([parseFloat(document.getElementsByClassName("cmplus")[i].value)]);
                  }
                  console.log(kern);
                  this.uniforms.matrix.u_matrix.value = kern;
                  this.uniforms.matrix.u_mplus.value = kern2;
                  this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                }}>
                  APPLY
                </button>
              </div>
            </div>
            <div style={{width: "160px"}} className="dropdown">
              FILTER PRESET
              <div className="dropdown-content">
                <button onClick={()=>{
                  this.uniforms.conv3x3.u_kernel.value = [-1,-1,-1,-1,8,-1,-1,-1,-1];
                  this.uniforms.conv3x3.u_kernelWeight.value = 1;
                  this.appendShader(this.vShader.conv3x3,this.fShader.conv3x3,this.uniforms.conv3x3)
                }}>
                  EDGE
                </button>
                <button onClick={()=>{
                  this.uniforms.conv3x3.u_kernel.value = [0.1,0.1,0.1,0.1,0.2,0.1,0.1,0.1,0.1];
                  this.uniforms.conv3x3.u_kernelWeight.value = 1;
                  this.appendShader(this.vShader.conv3x3,this.fShader.conv3x3,this.uniforms.conv3x3)
                }}>
                  BLUR
                </button>
                <button onClick={()=>{
                  var kern = [-1,0,0,0,-1,0,0,0,-1];
                  var kern2 = [1,1,1];
                  this.uniforms.matrix.u_matrix.value = kern;
                  this.uniforms.matrix.u_mplus.value = kern2;
                  this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                }}>
                  NEGATIVE
                </button>
                <div className="dropdown-div">
                  <button className="short" onClick={()=>{
                    var val = parseFloat(document.getElementById("i_con").value);
                    var kern = [1+(val*0.01),0,0,0,1+(val*0.01),0,0,0,1+(val*0.01)];
                    var kern2 = [-val*0.005,-val*0.005,-val*0.005];
                    this.uniforms.matrix.u_matrix.value = kern;
                    this.uniforms.matrix.u_mplus.value = kern2;
                    this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                  }}>
                    CONTRAST
                  </button>
                  <input style={{width: "20%", height: "100%"}} className = "singleinput" id="i_con" defaultValue="10" type="text" />
                  <div className="dropdown-span">%</div>
                </div>
                <div className="dropdown-div">
                  <button className="short" onClick={()=>{
                    var val = parseFloat(document.getElementById("i_sat").value);
                    var kern = [1+(val*0.0067),-(val*0.0033),-(val*0.0033),-(val*0.0033),1+(val*0.0067),-(val*0.0033),-(val*0.0033),-(val*0.0033),1+(val*0.0067)];
                    var kern2 = [0,0,0];
                    this.uniforms.matrix.u_matrix.value = kern;
                    this.uniforms.matrix.u_mplus.value = kern2;
                    this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                  }}>
                    SATURATION
                  </button>
                  <input style={{width: "20%", height: "100%"}} className = "singleinput" id="i_sat" defaultValue="10" type="text" />
                  <div className="dropdown-span">%</div>
                </div>
				<div className="dropdown-div">
                  <button className="short" onClick={()=>{
                    var val = parseFloat(document.getElementById("i_bri").value);
                    var kern = [1+(val*0.01),0,0,0,1+(val*0.01),0,0,0,1+(val*0.01)];
                    var kern2 = [0,0,0];
                    this.uniforms.matrix.u_matrix.value = kern;
                    this.uniforms.matrix.u_mplus.value = kern2;
                    this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                  }}>
                    BRIGHTNESS
                  </button>
                  <input style={{width: "20%", height: "100%"}} className = "singleinput" id="i_bri" defaultValue="10" type="text" />
                  <div className="dropdown-span">%</div>
                </div>
				<div className="dropdown-div">
                  <button className="short" onClick={()=>{
                    var val = parseFloat(document.getElementById("i_warm").value);
                    var kern = [1+(val*0.005),0,-(val*0.005),0,1,0,val*0.005,0,1-(val*0.005)];
                    var kern2 = [0,0,0];
                    this.uniforms.matrix.u_matrix.value = kern;
                    this.uniforms.matrix.u_mplus.value = kern2;
                    this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                  }}>
                    WARMTH
                  </button>
                  <input style={{width: "20%", height: "100%"}} className = "singleinput" id="i_warm" defaultValue="10" type="text" />
                  <div className="dropdown-span">%</div>
                </div>
				<div className="dropdown-div">
                  <button className="short" onClick={()=>{
                    var val = parseFloat(document.getElementById("i_tint").value);
                    var kern = [1+0.0033*val,-0.0033*val,0,0.0033*val,1-0.0067*val,0.0033*val,-0.0033*val,0,1+0.0033*val];
                    var kern2 = [0,0,0];
                    this.uniforms.matrix.u_matrix.value = kern;
                    this.uniforms.matrix.u_mplus.value = kern2;
                    this.appendShader(this.vShader.conv3x3,this.fShader.matrix,this.uniforms.matrix);
                  }}>
                    TINT
                  </button>
                  <input style={{width: "20%", height: "100%"}} className = "singleinput" id="i_tint" defaultValue="10" type="text" />
                  <div className="dropdown-span">%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p style={{paddingTop: "64px", color: "white"}}>PROCESSED IMAGE</p>
        <Stage id="processCanvas" style = {{maxWidth: "80vw", maxHeight: "80vh"}} width={this.state.width} height={this.state.height} options={{preserveDrawingBuffer: true, backgroundColor: 0xFFFFFF}}>
          <Sprite texture={this.state.texture} filters={this.state.shader}/>
        </Stage>
        <img style={{display: "none"}} id="img" alt="" src={this.state.imageDataURL}>
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
    this.processStack = [this.state.shader];
  }
  //appendShader: append a shader to filter list
  appendShader(vShaderCode,fShaderCode,uniforms) {
    var newShader = new PIXI.AbstractFilter(vShaderCode,fShaderCode,uniforms);
    var shader = this.state.shader;
    if(shader !== undefined) {
      this.setState({
        shader: shader.concat([newShader])
      });
    }
    console.log(this.state.shader);
    this.processStack = [this.state.shader];
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
