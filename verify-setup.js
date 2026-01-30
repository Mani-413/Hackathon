// Verification script to check if everything is set up correctly
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Hackathon Registration System Setup...\n');

let errors = [];
let warnings = [];

// Check backend files
console.log('Checking backend files...');
const backendFiles = [
    'backend/server.js',
    'backend/package.json'
];

backendFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        errors.push(`Missing file: ${file}`);
    }
});

// Check frontend files
console.log('\nChecking frontend files...');
const frontendFiles = [
    'frontend/index.html',
    'frontend/styles.css',
    'frontend/script.js'
];

frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        errors.push(`Missing file: ${file}`);
    }
});

// Check node_modules
console.log('\nChecking dependencies...');
if (fs.existsSync('backend/node_modules')) {
    console.log('  ✅ Backend dependencies installed');
} else {
    console.log('  ⚠️  Backend dependencies NOT installed');
    warnings.push('Run "npm install" in the backend folder');
}

// Check data directory
console.log('\nChecking data directory...');
const dataDir = 'backend/data';
if (fs.existsSync(dataDir)) {
    console.log('  ✅ Data directory exists');
} else {
    console.log('  ℹ️  Data directory will be created automatically');
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Setup looks good.');
    console.log('\nNext steps:');
    console.log('1. Start backend: cd backend && npm install && npm start');
    console.log('2. Start frontend: cd frontend && python -m http.server 8000');
    console.log('3. Open browser: http://localhost:8000');
} else {
    if (errors.length > 0) {
        console.log('❌ ERRORS FOUND:');
        errors.forEach(err => console.log(`   - ${err}`));
    }
    if (warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    console.log('\nPlease fix the issues above before running the application.');
}
console.log('='.repeat(50));

process.exit(errors.length > 0 ? 1 : 0);
