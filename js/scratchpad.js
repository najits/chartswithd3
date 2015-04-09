// Generates correlated random normals
var correlatedRandoms = function() {
	var normal1 = {'mean': 8, 'stddev': 15};
	var normal2 = {'mean': 9, 'stddev': 13};
	var corr = 0.6;
	var obs = 100;

	var randGenX = d3.random.normal(normal1.mean / 12, normal1.stddev / Math.sqrt(12));
	var randGenY = d3.random.normal(normal2.mean / 12, normal2.stddev / Math.sqrt(12));

	var _corrRoot = Math.sqrt(1 - Math.pow(corr, 2));

	var data = [];

	for(var i = 0; i < obs; i++) {
		var obj = {};

		var x1 = randGenX();
		var x2 = randGenY();
		var y1 = (corr * x1) + (_corrRoot * x2);

		obj.x = x1;
		obj.y = y1;
		data.push(obj);
	}

	return data;
}