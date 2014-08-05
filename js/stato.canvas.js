
window.stato = window.stato || {};

(function(stato) {

	try {

		var canvas = document.getElementById('canvas');

		var context = canvas.getContext('2d');

		window.onresize = function() {
	        canvas.width = window.innerWidth;
	        canvas.height = window.innerHeight;
	        stato.layout();
		}

		stato.Context = function() {
			return context;
		};

		stato.Refresh = function() {

	    	context.save();
	    	{
			    context.setTransform(1, 0, 0, 1, 0, 0);
			    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	    	}
	    	context.restore();
		};

		stato.Prepare = function(d, c, r) {

		    d = d || 7.5;
			c = c || 'white';
		    r = r || 0.0;

		    context.save();
		    {
			    context.rotate(r * Math.PI / 180);

			    context.beginPath();
			    context.moveTo(-d / 2, 0);
			    context.lineTo(+d / 2, 0);
			    context.strokeStyle = c;
			    context.stroke();

			    context.beginPath();
			    context.moveTo(0, -d / 2);
			    context.lineTo(0, +d / 2);
			    context.strokeStyle = c;
			    context.stroke();
			}
		    context.restore();
		};

		stato.Text = function(text, options) {

			options = options || {};

			context.save();
		    {
		    	context.font = options.font || "18pt  Arial";
				context.fillStyle = options.color || "#ffffff";
				context.textAlign = "center";
				context.textBaseline = "middle";
				context.fillText(text, options.x || 0, options.y || 0);
			}
			context.restore();
		};

		stato.layout = function() {

			context.setTransform(5, 0, 0, 5, canvas.width / 2.0, canvas.height / 2.0);

		};
	} catch(ex) {
		
	}

})(window.stato);

