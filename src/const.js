const APPROX = 1;
const DEFLIGHTPOS = { x: 0, y: 100, z: 350 };
const DEFLIGHTDIR = { x: -1, y: 3, z: 5 };
const LIMITX = { lower: -40, upper: 40 };
const LIMITY = { lower: -40, upper: 40 };
const LIMITZ = { lower: 0, upper: 40 };

const VS = `
	attribute vec4 a_position; 
	attribute vec2 a_texcoord; 		
	attribute vec3 a_normal; 
	attribute vec4 a_color; 
  
	uniform mat4 u_projection; 
	uniform mat4 u_view;      
	uniform mat4 u_world;    
	uniform vec3 u_lightPosition; 
	uniform vec3 u_viewWorldPosition; 
	uniform vec3 u_lightWorldPosition;
	uniform mat4 u_worldInverseTranspose;
  
	varying vec2 v_texcoord;        
	varying vec3 v_normal;	
	varying vec3 v_surfaceToView; 
	varying vec3 v_surfaceToLight;
	varying vec4 v_color;  
  
	void main() {

	  vec4 worldPosition = u_world * a_position; 
	  gl_Position = u_projection * u_view * worldPosition; 
	  v_texcoord = a_texcoord; 
	  v_normal = mat3(u_worldInverseTranspose) * a_normal;  
	  // compute the world position of the surface
	  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
	  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition; 
	  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition; 
	  v_color = a_color; 		
	}
	`;

const FS = `
	precision highp float;

	varying vec2 v_texcoord;		
	varying vec3 v_normal;  			
	varying vec3 v_surfaceToView; 		
	varying vec4 v_color;				 
	varying vec3 v_surfaceToLight;
	
	uniform vec3 diffuse;    			  	
	uniform vec3 ambient;				  
	uniform vec3 emissive;				  
	uniform vec3 specular;				  
	uniform vec3 u_lightDirection; 		  
	uniform vec3 u_ambientLight;          
	uniform vec3 u_reverseLightDirection; 
	uniform vec4 u_colorMult;
	uniform vec4 u_diffuse;  				

	uniform sampler2D diffuseMap;	
	uniform sampler2D specularMap;
	uniform sampler2D normalMap;

	uniform float opacity;
	uniform float shininess;
	uniform float u_bias;
	uniform float u_lightIntensity;
	uniform float u_shadowIntensity;
	
	void main () {
		vec3 normal = normalize(v_normal); 
		normal = texture2D(normalMap, v_texcoord).rgb * 2. - 1.;
		
		vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
		vec3 surfaceToViewDirection = normalize(v_surfaceToView);          		
		vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);   
		
		float light = dot(v_normal, surfaceToLightDirection);                     
		float specularLight = dot(normal, halfVector);  				
		vec4 specularMapColor = texture2D(specularMap, v_texcoord);
		vec3 effectiveSpecular = specular * specularMapColor.rgb;
	
		vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);				
		vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;   
		float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;   	

		gl_FragColor = vec4(
			emissive +
			ambient * u_ambientLight +
			effectiveDiffuse * light +
			effectiveSpecular * pow(specularLight, shininess),
			effectiveOpacity);
	}
	`;
