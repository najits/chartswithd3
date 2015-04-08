// Generates correlated random normals
var correlatedRandoms = function() {
	var normal1 = [8, 15];
	var normal2 = [9, 13];
	var corr = 0.6;
	var obs = 100;

	var randGenX = d3.random.normal(normal1[0] / 12, normal1[1] / Math.sqrt(12));
	var randGenY = d3.random.normal(normal2[0] / 12, normal2[1] / Math.sqrt(12));

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